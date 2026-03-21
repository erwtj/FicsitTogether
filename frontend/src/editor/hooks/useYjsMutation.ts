import { useCallback } from "react";
import { type Node, type Edge, useReactFlow } from "@xyflow/react";
import { useYjsDoc } from "../context/YjsContext";
import { stripComputedFields } from "../utils/idUtils";
import type {ItemEdgeData} from "../types.ts";

const LOCAL_ORIGIN = "local";

/**
 * Returns helpers to update node / edge data in the shared Y.Doc.
 * Safe to call from any node or edge component wrapped by YjsContext.
 */
export function useYjsMutation() {
    const ydocRef = useYjsDoc();
    const reactflow = useReactFlow();

    /**
     * Merge `patch` into the data of the node with the given id.
     * Only updates the Yjs map; ReactFlow state is synced back via useYjsSync.
     */
    const updateNodeData = useCallback(
        (nodeId: string, patch: Record<string, unknown>) => {
            const doc = ydocRef.current;
            if (!doc) return;
            const nodeMap = doc.getMap<Node>("nodes");
            const node = nodeMap.get(nodeId);
            if (node) {
                reactflow.setNodes((nds) =>
                    nds.map((n) =>
                        n.id === nodeId ? stripComputedFields({ ...n, data: { ...n.data, ...patch } }) : n,
                    ),
                );

                doc.transact(() => {
                    nodeMap.set(nodeId, stripComputedFields({ ...node, data: { ...node.data, ...patch } }));
                }, LOCAL_ORIGIN);
            }
        },
        [reactflow, ydocRef],
    );

    /**
     * Merge `patch` into the data of the edge with the given id.
     */
    const updateEdgeData = useCallback(
        (edgeId: string, patch: Record<string, unknown>) => {
            const doc = ydocRef.current;
            if (!doc) return;
            const edgeMap = doc.getMap<Edge>("edges");
            const edge = edgeMap.get(edgeId);
            if (edge) {
                doc.transact(() => {
                    edgeMap.set(edgeId, { ...edge, data: { ...edge.data, ...patch } });
                }, LOCAL_ORIGIN);
            }
        },
        [ydocRef],
    );

    const updateNodeAndSingleEdgeData = useCallback(
        (nodeId: string, patch: Record<string, unknown>) => {
            const doc = ydocRef.current;
            if (!doc) return;

            const nodeMap = doc.getMap<Node>("nodes");
            const edgeMap = doc.getMap<Edge>("edges");

            const node = nodeMap.get(nodeId);
            if (!node) return;

            const outgoingEdges = Array.from(edgeMap.values()).filter(
                (edge) =>
                    edge.source === nodeId
            );

            doc.transact(() => {
                nodeMap.set(nodeId, stripComputedFields({ ...node, data: { ...node.data, ...patch } }));
                reactflow.setNodes((nds) =>
                    nds.map((n) =>
                        n.id === nodeId ? stripComputedFields({ ...n, data: { ...n.data, ...patch } }) : n,
                    ),
                );

                if (outgoingEdges.length === 1) {
                    const edge = outgoingEdges[0];
                    const edgeId = edge.id;

                    const edgePatch: Partial<ItemEdgeData> = {
                        throughput: patch.outputAmount as number | undefined,
                    }

                    reactflow.setEdges((eds) =>
                        eds.map((e) =>
                            e.id === edgeId ? { ...e, data: { ...e.data, ...edgePatch } } : e,
                        ),
                    );

                    edgeMap.set(edgeId, { ...edge, data: { ...edge.data, ...edgePatch } });
                }
            }, LOCAL_ORIGIN);
        },
        [reactflow, ydocRef],
    )

    return { updateNodeData, updateEdgeData, updateNodeAndSingleEdgeData };
}