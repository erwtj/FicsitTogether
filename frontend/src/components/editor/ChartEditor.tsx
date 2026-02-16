import { useAuth0Context } from "../../auth/useAuth0Context.ts";
import { useEffect, useState, useCallback } from "react";
import {
    ReactFlow,
    type Node,
    type Edge,
    // addEdge,
    // applyNodeChanges,
    // applyEdgeChanges,
    type NodeChange,
    type EdgeChange,
    type Connection,
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow
} from "@xyflow/react";
import * as Y from "yjs";
import {YMapEvent} from "yjs";
import "@xyflow/react/dist/style.css";
import "./ChartEditor.css";
import {initialNodes} from "./nodes";
import {initialEdges} from "./edges";

interface ChartEditorProps {
    projectId: string;
}

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

function ChartEditorInner({ projectId }: ChartEditorProps) {
    const auth = useAuth0Context();
    const reactFlow = useReactFlow();
    
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
    
    const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        let websocket: WebSocket | null = null;
        let doc: Y.Doc | null = null;

        auth?.getAccessTokenSilently()?.then((token) => {
            // Create Yjs document
            doc = new Y.Doc();
            setYdoc(doc);

            const nodeMap = doc.getMap<Node>("nodes");
            const edgeMap = doc.getMap<Edge>("edges");

            // Connect to WebSocket
            websocket = new WebSocket(
                `${import.meta.env.VITE_WS_URL}/${projectId}`,
                [`bearer.${token}`]
            );

            websocket.binaryType = "arraybuffer";

            websocket.onopen = () => {
                console.log("WebSocket connected");
            };

            websocket.onmessage = (event) => {
                if (!(event.data instanceof ArrayBuffer)) {
                    return;
                }

                const message = new Uint8Array(event.data);
                const messageType = message[0];
                const content = message.slice(1);

                if (messageType === MESSAGE_SYNC) {
                    // Apply Yjs update from server
                    Y.applyUpdate(doc!, content);
                } else if (messageType === MESSAGE_AWARENESS) {
                    // Handle awareness updates (user presence, cursors, etc.)
                    // We'll implement this later
                    console.log("Awareness update received");
                }
            };

            websocket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            websocket.onclose = () => {
                console.log("WebSocket closed");
            };

            // Listen for changes to nodes and edges in Yjs
            const updateNodes = (event: YMapEvent<Node>, transaction: Y.Transaction) => {
                if (transaction.local) return;
                
                event.keysChanged.forEach(key => {
                    const newNode = nodeMap.get(key);

                    if (newNode) {
                        // Node added or updated
                        const reactFlowNode = reactFlow.getNode(key);
                        if (reactFlowNode) {
                            newNode.selected = reactFlowNode.selected;
                            newNode.width = reactFlowNode.width;
                            newNode.height = reactFlowNode.height;
                        } else {
                            newNode.selected = false;
                        }

                        setNodes((prevNodes) => {
                            const index = prevNodes.findIndex(node => node.id === key);
                            if (index !== -1) {
                                // Update existing node
                                const newNodes = [...prevNodes];
                                newNodes[index] = newNode;

                                return newNodes;
                            } else {
                                // Add new node
                                return [...prevNodes, newNode];
                            }
                        });
                    } else {
                        // Node deleted
                        setNodes((prevNodes) => prevNodes.filter(node => node.id !== key));
                    }
                });
            };

            const updateEdges = (event: YMapEvent<Edge>) => {
                event.keysChanged.forEach(key => {
                    const newEdge = edgeMap.get(key);

                    if (newEdge) {
                        // Edge added or updated
                        const reactFlowEdge = reactFlow.getEdge(key);
                        newEdge.selected = reactFlowEdge?.selected ?? false; // Copy selected state from react flow

                        setEdges((prevEdges) => {
                            const index = prevEdges.findIndex(edge => edge.id === key);
                            if (index !== -1) {
                                // Update existing edge
                                const newEdges = [...prevEdges];
                                newEdges[index] = newEdge;

                                return newEdges;
                            } else {
                                // Add new edge
                                return [...prevEdges, newEdge];
                            }
                        });
                    } else {
                        // Edge deleted
                        setEdges((prevEdges) => prevEdges.filter(edge => edge.id !== key));
                    }
                });
            };

            // Subscribe to Yjs changes
            nodeMap.observe(updateNodes);
            edgeMap.observe(updateEdges);

            // Initial load
            // updateNodes();
            // updateEdges();

            setWs(websocket);

            // Cleanup observers
            return () => {
                nodeMap.unobserve(updateNodes);
                edgeMap.unobserve(updateEdges);
            };
        }).catch((error) => {
            console.error("Auth error:", error);
        });

        // Cleanup function
        return () => {
            if (websocket) {
                websocket.close();
            }
            if (doc) {
                doc.destroy();
            }
        };
    }, [auth, projectId]);

    // Send Yjs updates to server
    const sendUpdate = useCallback((update: Uint8Array) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = new Uint8Array([MESSAGE_SYNC, ...update]);
            ws.send(message);
        }
    }, [ws]);

    // Listen for local Yjs changes and send to server
    useEffect(() => {
        if (!ydoc) return;

        const updateHandler = (update: Uint8Array) => {
            sendUpdate(update);
        };

        ydoc.on("update", updateHandler);

        return () => {
            ydoc.off("update", updateHandler);
        };
    }, [ydoc, sendUpdate]);

    // Handle node changes from ReactFlow
    const onNodesChangeInternal = useCallback(
        (changes: NodeChange[]) => {
            if (!ydoc) return;

            ydoc.transact(() => {
                const nodeMap = ydoc.getMap<Node>("nodes");
    
                // Apply changes to Yjs document
                changes.forEach((change) => {
                    if (change.type === "add") {
                        nodeMap.set(change.item.id, change.item);
                    } else if (change.type === "remove") {
                        nodeMap.delete(change.id);
                    } else if (change.type === "position" && change.position) {
                        const node = nodeMap.get(change.id);
                        if (node) {
                            nodeMap.set(change.id, {
                                ...node,
                                position: change.position,
                            });
                        }
                    } else if (change.type === "dimensions" && change.dimensions) {
                        const node = nodeMap.get(change.id);
                        if (node) {
                            nodeMap.set(change.id, {
                                ...node,
                                width: change.dimensions.width,
                                height: change.dimensions.height,
                            });
                        }
                    } else if (change.type === "select") {
                        const node = nodeMap.get(change.id);
                        if (node) {
                            nodeMap.set(change.id, {
                                ...node,
                                selected: change.selected,
                            });
                        }
                    }
                });
            });

            onNodesChange(changes);
        },
        [ydoc, onNodesChange]
    );

    // Handle edge changes from ReactFlow
    const onEdgesChangeInternal = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChange(changes);
            
            if (!ydoc) return;

            const edgeMap = ydoc.getMap<Edge>("edges");

            changes.forEach((change) => {
                if (change.type === "add") {
                    edgeMap.set(change.item.id, change.item);
                } else if (change.type === "remove") {
                    edgeMap.delete(change.id);
                } else if (change.type === "select") {
                    const edge = edgeMap.get(change.id);
                    if (edge) {
                        edgeMap.set(change.id, {
                            ...edge,
                            selected: change.selected,
                        });
                    }
                }
            });
        },
        [ydoc, onEdgesChange]
    );

    // Handle new connections (when user draws an edge)
    const onConnect = useCallback(
        (connection: Connection) => {
            if (!ydoc) return;

            const edgeMap = ydoc.getMap<Edge>("edges");
            const newEdge: Edge = {
                id: `edge-${Date.now()}`,
                source: connection.source!,
                target: connection.target!,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
            };

            edgeMap.set(newEdge.id, newEdge);
            // setEdges((eds) => addEdge(connection, eds));
        },
        [ydoc]
    );
    
    const onDoubleClick = (event: React.MouseEvent) => {
        if (!ydoc) return;

        // Get ReactFlow instance to convert screen coords to flow coords
        const reactFlowBounds = event.currentTarget.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        };

        const nodeMap = ydoc.getMap<Node>("nodes");
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: "default",
            position,
            data: { label: "Clicked Node" },
        };

        nodeMap.set(newNode.id, newNode);
    };

    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeInternal}
                onEdgesChange={onEdgesChangeInternal}
                onConnect={onConnect}
                fitView
                onDoubleClickCapture={onDoubleClick}
            >
                <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40}/>
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}

// Wrapper component that has access to ReactFlowProvider context
function ChartEditor(props: ChartEditorProps) {
    return <ChartEditorInner {...props} />;
}

export default ChartEditor;