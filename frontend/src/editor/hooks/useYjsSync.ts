import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import { YMapEvent } from "yjs";
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, useReactFlow } from "@xyflow/react";
import { stripComputedFields } from "../utils/idUtils";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

interface UseYjsSyncProps {
    projectId: string;
    token: string | null;
    ydocRef: React.RefObject<Y.Doc | null>;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

const LOCAL_ORIGIN = "local";

const RECONNECT_DELAY_MS = 5000;

export function useYjsSync({ projectId, token, ydocRef, setNodes, setEdges }: UseYjsSyncProps) {
    const reactFlow = useReactFlow();
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const destroyedRef = useRef(false);
    // Only true after the server's initial state has been received and applied.
    // No local updates are sent until this is set (prevents a blank doc from wiping the server)
    const syncedRef = useRef(false);

    const sendUpdate = useCallback((update: Uint8Array) => {
        console.log("Sending local update")
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN && syncedRef.current) {
            const message = new Uint8Array([MESSAGE_SYNC, ...update]);
            ws.send(message);
        }
    }, []);

    useEffect(() => {
        if (!token) return;

        destroyedRef.current = false;

        const doc = new Y.Doc();
        ydocRef.current = doc;

        const nodeMap = doc.getMap<Node>("nodes");
        const edgeMap = doc.getMap<Edge>("edges");

        // --- Yjs observers ---

        const updateNodes = (event: YMapEvent<Node>) => {
            if (event.transaction.origin === LOCAL_ORIGIN) return;

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
            if (event.transaction.origin === LOCAL_ORIGIN) return;

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

        // --- WebSocket with auto-reconnect ---

        const connect = () => {
            if (destroyedRef.current) return;

            // Not synced until the server sends us its initial state
            syncedRef.current = false;

            const ws = new WebSocket(
                `${import.meta.env.VITE_WS_URL}/${projectId}`,
                [`bearer.${token}`]
            );
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                console.log("WebSocket connected");
            };

            ws.onerror = (error) => {
                console.error("WebSocket error:", error);
            }

            ws.onclose = () => {
                setConnected(false);
                syncedRef.current = false;
                wsRef.current = null;
                if (!destroyedRef.current) {
                    console.log(`WebSocket closed. Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
                    reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
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
                    // Capture what the server knows before merging its state in
                    const serverStateVector = Y.encodeStateVectorFromUpdate(content);
                    // Compute what the local doc has that the server is missing (e.g. offline edits)
                    const localDiff = Y.encodeStateAsUpdate(doc, serverStateVector);

                    Y.applyUpdate(doc, content);

                    // Send the diff back so the server learns about any offline changes.
                    // Only send if there is actually something new (an empty update is 2 bytes).
                    if (localDiff.length > 2) {
                        const diffMessage = new Uint8Array([MESSAGE_SYNC, ...localDiff]);
                        ws.send(diffMessage);
                    }

                    // Mark as synced — from this point on all local changes are forwarded normally.
                    syncedRef.current = true;
                } else if (messageType === MESSAGE_AWARENESS) {
                    // TODO: Do some shit with awareness
                    console.log("Awareness update received");
                }
            };
        };

        connect();

        return () => {
            destroyedRef.current = true;
            if (reconnectTimerRef.current !== null) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            nodeMap.unobserve(updateNodes);
            edgeMap.unobserve(updateEdges);
            doc.off("update", sendUpdate);
            doc.destroy();
            wsRef.current?.close();
            ydocRef.current = null;
            wsRef.current = null;
        };
    }, [projectId, token]); // DO NOT ADD reactFlow, setNodes, setEdges

    return { wsRef, connected };
}