import { useCallback } from "react";
import * as Y from "yjs";
import {
    type Node, type Edge,
    type NodeChange, type EdgeChange, type Connection,
    useNodesState, useEdgesState
} from "@xyflow/react";
import {initialNodes} from "../nodes";
import {initialEdges} from "../edges";

const LOCAL_ORIGIN = "local";

export function useNodeEdgeHandlers(ydocRef: React.RefObject<Y.Doc | null>) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

    const onNodesChangeInternal = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        doc.transact(() => {
            const nodeMap = doc.getMap<Node>("nodes");
            changes.forEach((change) => {
                if (change.type === "remove" && nodeMap.has(change.id)) {
                    nodeMap.delete(change.id);
                } else if (change.type === "add") {
                    nodeMap.set(change.item.id, change.item);
                } else if (change.type === "position") {
                    const node = nodeMap.get(change.id);
                    if (node && change.position) {
                        nodeMap.set(change.id, { ...node, position: change.position });
                    }
                } else if (change.type === "dimensions") {
                    const node = nodeMap.get(change.id);
                    if (node) {
                        nodeMap.set(change.id, {
                            ...node,
                            width: change.dimensions?.width ?? node.width,
                            height: change.dimensions?.height ?? node.height,
                        });
                    }
                }
            });
        }, LOCAL_ORIGIN);
    }, [onNodesChange, ydocRef]);

    const onEdgesChangeInternal = useCallback((changes: EdgeChange[]) => {
        onEdgesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        doc.transact(() => {
            const edgeMap = doc.getMap<Edge>("edges");
            changes.forEach((change) => {
                if (change.type === "add") {
                    edgeMap.set(change.item.id, change.item);
                } else if (change.type === "remove") {
                    edgeMap.delete(change.id);
                } else if (change.type === "select") {
                    const edge = edgeMap.get(change.id);
                    if (edge) edgeMap.set(change.id, { ...edge, selected: change.selected });
                }
            });
        }, LOCAL_ORIGIN);
    }, [onEdgesChange, ydocRef]);

    const onConnect = useCallback((connection: Connection) => {
        const doc = ydocRef.current;
        if (!doc) return;

        const newEdge: Edge = {
            id: `edge-${Date.now()}`,
            source: connection.source!,
            target: connection.target!,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
        };
        doc.getMap<Edge>("edges").set(newEdge.id, newEdge);
    }, [ydocRef]);

    return { nodes, setNodes, edges, setEdges, onNodesChangeInternal, onEdgesChangeInternal, onConnect };
}