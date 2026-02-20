import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import { YMapEvent } from "yjs";
import { type Node, type Edge, applyNodeChanges, applyEdgeChanges, useReactFlow } from "@xyflow/react";

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

export function useYjsSync({ projectId, token, ydocRef, setNodes, setEdges }: UseYjsSyncProps) {
    const reactFlow = useReactFlow();
    const wsRef = useRef<WebSocket | null>(null);

    const sendUpdate = useCallback((update: Uint8Array) => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            const message = new Uint8Array([MESSAGE_SYNC, ...update]);
            ws.send(message);
        }
    }, []);

    useEffect(() => {
        if (!token) return;

        const doc = new Y.Doc();
        ydocRef.current = doc;

        const nodeMap = doc.getMap<Node>("nodes");
        const edgeMap = doc.getMap<Edge>("edges");

        // --- Yjs observers ---

        const updateNodes = (event: YMapEvent<Node>) => {
            if (event.transaction.origin === LOCAL_ORIGIN) return;

            event.keysChanged.forEach(key => {
                const newNode = nodeMap.get(key);
                if (newNode) {
                    const existing = reactFlow.getNode(key);
                    if (existing) {
                        // Preserve ReactFlow internal state
                        newNode.selected = existing.selected;
                        newNode.width = existing.width;
                        newNode.height = existing.height;
                        newNode.measured = existing.measured;
                        setNodes(prev => applyNodeChanges([{ type: "replace", id: key, item: newNode }], prev));
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { width, height, measured, ...freshNode } = newNode;
                        setNodes(prev => applyNodeChanges([{ type: "add", item: freshNode }], prev));
                    }
                } else {
                    setNodes(prev => applyNodeChanges([{ type: "remove", id: key }], prev));
                }
            });
        };

        const updateEdges = (event: YMapEvent<Edge>) => {
            if (event.transaction.origin === LOCAL_ORIGIN) return;
            
            event.keysChanged.forEach(key => {
                const newEdge = edgeMap.get(key);
                if (newEdge) {
                    const existing = reactFlow.getEdge(key);
                    if (existing) {
                        newEdge.selected = existing.selected;
                        setEdges(prev => applyEdgeChanges([{ type: "replace", id: key, item: newEdge }], prev));
                    } else {
                        setEdges(prev => applyEdgeChanges([{ type: "add", item: newEdge }], prev));
                    }
                } else {
                    setEdges(prev => applyEdgeChanges([{ type: "remove", id: key }], prev));
                }
            });
        };

        nodeMap.observe(updateNodes);
        edgeMap.observe(updateEdges);

        // --- WebSocket ---

        const ws = new WebSocket(
            `${import.meta.env.VITE_WS_URL}/${projectId}`,
            [`bearer.${token}`]
        );
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => console.log("WebSocket connected");
        ws.onerror = (error) => console.error("WebSocket error:", error);
        ws.onclose = () => console.log("WebSocket closed");
        ws.onmessage = (event) => {
            if (!(event.data instanceof ArrayBuffer)) return;
            const message = new Uint8Array(event.data);
            const messageType = message[0];
            const content = message.slice(1);

            if (messageType === MESSAGE_SYNC) {
                Y.applyUpdate(doc, content);
            } else if (messageType === MESSAGE_AWARENESS) {
                // TODO: Do some shit with awareness 
                console.log("Awareness update received");
            }
        };

        // Forward local Yjs changes to server
        doc.on("update", sendUpdate);

        return () => {
            nodeMap.unobserve(updateNodes);
            edgeMap.unobserve(updateEdges);
            doc.off("update", sendUpdate);
            doc.destroy();
            ws.close();
            ydocRef.current = null;
            wsRef.current = null;
        };
    }, [projectId, token]); // DO NOT ADD reactFlow, setNodes, setEdges

    return { wsRef };
}