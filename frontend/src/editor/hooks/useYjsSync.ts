import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import { YMapEvent, UndoManager } from "yjs";
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, useReactFlow } from "@xyflow/react";
import { stripComputedFields } from "../utils/idUtils";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const MESSAGE_SYNC_STEP_1 = 2; // Client sends state vector to server
const MESSAGE_SYNC_STEP_2 = 3; // Server sends missing updates to client

interface UseYjsSyncProps {
    projectId: string;
    getAccessToken: () => Promise<string | null>;
    ydocRef: React.RefObject<Y.Doc | null>;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

const LOCAL_ORIGIN = "local";

const RECONNECT_DELAY_MS = -1;

export function useYjsSync({ projectId, getAccessToken, ydocRef, setNodes, setEdges }: UseYjsSyncProps) {
    const reactFlow = useReactFlow();
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const destroyedRef = useRef(false);
    // Only true after the server's initial state has been received and applied.
    // No local updates are sent until this is set (prevents a blank doc from wiping the server)
    const syncedRef = useRef(false);
    const undoManagerRef = useRef<UndoManager | null>(null);

    const sendUpdate = useCallback((update: Uint8Array) => {
        console.log("Sending local update")
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN && syncedRef.current) {
            const message = new Uint8Array([MESSAGE_SYNC, ...update]);
            ws.send(message);
        }
    }, []);

    useEffect(() => {
        destroyedRef.current = false;

        const doc = new Y.Doc();
        ydocRef.current = doc;

        const nodeMap = doc.getMap<Node>("nodes");
        const edgeMap = doc.getMap<Edge>("edges");

        // --- Yjs observers ---

        const updateNodes = (event: YMapEvent<Node>) => {
            // Skip local changes UNLESS they're from undo/redo
            // UndoManager uses the original transaction's origin, so we need to check if it's an undo operation
            const isUndoRedo = event.transaction.origin === undoManagerRef.current;
            if (event.transaction.origin === LOCAL_ORIGIN && !isUndoRedo) return;

            const nodeChanges: Parameters<typeof applyNodeChanges>[0] = [];

            event.keysChanged.forEach(key => {
                const newNode = nodeMap.get(key);
                if (newNode) {
                    const cleanNode = stripComputedFields(newNode);
                    const existing = reactFlow.getNode(key);
                    if (existing) {
                        // Preserve ReactFlow internal state
                        cleanNode.selected = existing.selected;
                        cleanNode.width = existing.width;
                        cleanNode.height = existing.height;
                        cleanNode.measured = existing.measured;
                        // Preserve locally-computed _ fields (not stored in Yjs)
                        if (existing.data && cleanNode.data) {
                            const ed = existing.data as Record<string, unknown>;
                            const nd = cleanNode.data as Record<string, unknown>;
                            for (const k of Object.keys(ed)) {
                                if (k.startsWith("_")) nd[k] = ed[k];
                            }
                        }
                        nodeChanges.push({ type: "replace", id: key, item: cleanNode });
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { width, height, measured, ...freshNode } = cleanNode;
                        freshNode.selected = false;
                        nodeChanges.push({ type: "add", item: freshNode });
                    }
                } else {
                    nodeChanges.push({ type: "remove", id: key });
                }
            });

            if (nodeChanges.length > 0) {
                setNodes(prev => applyNodeChanges(nodeChanges, prev));
            }
        };

        const updateEdges = (event: YMapEvent<Edge>) => {
            // Skip local changes UNLESS they're from undo/redo
            const isUndoRedo = event.transaction.origin === undoManagerRef.current;
            if (event.transaction.origin === LOCAL_ORIGIN && !isUndoRedo) return;

            const edgeChanges: Parameters<typeof applyEdgeChanges>[0] = [];

            event.keysChanged.forEach(key => {
                const newEdge = edgeMap.get(key);
                if (newEdge) {
                    const existing = reactFlow.getEdge(key);
                    if (existing) {
                        newEdge.selected = existing.selected;
                        edgeChanges.push({ type: "replace", id: key, item: newEdge });
                    } else {
                        newEdge.selected = false;
                        edgeChanges.push({ type: "add", item: newEdge });
                    }
                } else {
                    edgeChanges.push({ type: "remove", id: key });
                }
            });

            if (edgeChanges.length > 0) {
                setEdges(prev => applyEdgeChanges(edgeChanges, prev));
            }
        };

        nodeMap.observe(updateNodes);
        edgeMap.observe(updateEdges);

        // Forward local Yjs changes to server
        doc.on("update", sendUpdate);

        // --- Undo/Redo Manager ---

        const undoManager = new UndoManager([nodeMap, edgeMap], {
            trackedOrigins: new Set([LOCAL_ORIGIN]), // Only undo local changes, not remote ones
            captureTimeout: 500, // Group rapid changes within 500ms into a single undo step
        });
        undoManagerRef.current = undoManager;

        // Keyboard shortcuts for undo/redo
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept undo/redo when user is typing in an input field
            const target = e.target as HTMLElement;
            const isInputField = target.tagName === 'INPUT' || 
                                 target.tagName === 'TEXTAREA' || 
                                 target.isContentEditable;
            
            if (isInputField) return;

            // Ctrl+Z or Cmd+Z (undo)
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                undoManager.undo();
            } 
            // Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y or Cmd+Y (redo)
            else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
                e.preventDefault();
                undoManager.redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // --- WebSocket with auto-reconnect ---

        const connect = async () => {
            if (destroyedRef.current) return;

            // Not synced until the server sends us its initial state
            syncedRef.current = false;

            let token: string | null = null;
            try {
                token = await getAccessToken();
            } catch (error) {
                console.warn("Failed to get access token for websocket connection", error);
            }

            if (destroyedRef.current) return;

            if (!token) {
                setConnected(false);
                if (!destroyedRef.current && RECONNECT_DELAY_MS > 0) {
                    reconnectTimerRef.current = setTimeout(() => {
                        void connect();
                    }, RECONNECT_DELAY_MS);
                }
                return;
            }

            const ws = new WebSocket(
                `${import.meta.env.VITE_WS_URL}/${projectId}`,
                [`bearer.${token}`]
            );
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                console.log("WebSocket connected");
                
                // Send our state vector to the server so it knows what we have
                // Server will send us only the updates we're missing
                const stateVector = Y.encodeStateVector(doc);
                const syncStep1Message = new Uint8Array([MESSAGE_SYNC_STEP_1, ...stateVector]);
                ws.send(syncStep1Message);
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            }

            ws.onclose = () => {
                setConnected(false);
                syncedRef.current = false;
                wsRef.current = null;
                
                // Clear undo stack on disconnect to avoid confusion when server state diverges
                if (undoManagerRef.current) {
                    undoManagerRef.current.clear();
                }
                
                if (!destroyedRef.current && RECONNECT_DELAY_MS > 0) {
                    console.log(`WebSocket closed. Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
                    reconnectTimerRef.current = setTimeout(() => {
                        void connect();
                    }, RECONNECT_DELAY_MS);
                } else {
                    console.log("WebSocket closed.");
                }
            };

            ws.onmessage = (event) => {
                if (!(event.data instanceof ArrayBuffer)) return;
                const message = new Uint8Array(event.data);
                const messageType = message[0];
                const content = message.slice(1);

                if (messageType === MESSAGE_SYNC) {
                    // Regular sync update from another client
                    Y.applyUpdate(doc, content);
                } else if (messageType === MESSAGE_SYNC_STEP_1) {
                    // Server is requesting our updates based on their state vector
                    const serverStateVector = content;
                    const updateForServer = Y.encodeStateAsUpdate(doc, serverStateVector);
                    if (updateForServer.length > 0) {
                        console.log("Sending updates server is missing");
                        const syncMessage = new Uint8Array([MESSAGE_SYNC, ...updateForServer]);
                        ws.send(syncMessage);
                    }
                } else if (messageType === MESSAGE_SYNC_STEP_2) {
                    // Server's response to our state vector - contains updates we're missing
                    Y.applyUpdate(doc, content);
                    
                    // Mark as synced - we can now send future updates
                    syncedRef.current = true;
                    console.log("Sync completed");
                } else if (messageType === MESSAGE_AWARENESS) {
                    // TODO: Do some shit with awareness
                    console.log("Awareness update received");
                }
            };
        };

        void connect();

        return () => {
            destroyedRef.current = true;
            if (reconnectTimerRef.current !== null) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            window.removeEventListener('keydown', handleKeyDown);
            if (undoManagerRef.current) {
                undoManagerRef.current.clear();
                undoManagerRef.current = null;
            }
            nodeMap.unobserve(updateNodes);
            edgeMap.unobserve(updateEdges);
            doc.off("update", sendUpdate);
            doc.destroy();
            wsRef.current?.close();
            ydocRef.current = null;
            wsRef.current = null;
        };
        // This effect intentionally avoids depending on rapidly-changing editor refs/state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, getAccessToken]); // DO NOT ADD reactFlow, setNodes, setEdges

    return { wsRef, connected };
}