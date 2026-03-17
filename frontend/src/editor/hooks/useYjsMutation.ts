import { useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { useYjsDoc } from "../context/YjsContext";
import { stripComputedFields } from "../utils/idUtils";
import type {ItemEdgeData} from "../types.ts";

/**
 * Returns helpers to update node / edge data in the shared Y.Doc.
 * Safe to call from any node or edge component wrapped by YjsContext.
 */
export function useYjsMutation() {
    const ydocRef = useYjsDoc();

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
                nodeMap.set(nodeId, stripComputedFields({ ...node, data: { ...node.data, ...patch } }));
            }

        },
        [ydocRef],
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
                edgeMap.set(edgeId, { ...edge, data: { ...edge.data, ...patch } });
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



            if (outgoingEdges.length === 1) {
                const edge = outgoingEdges[0];
                const edgeId = edge.id;

                const edgePatch: Partial<ItemEdgeData> = {
                    throughput: patch.outputAmount as number | undefined,
                }

                nodeMap.set(nodeId, stripComputedFields({ ...node, data: { ...node.data, ...patch } }));
                edgeMap.set(edgeId, { ...edge, data: { ...edge.data, ...edgePatch } });
            }
            else {
                nodeMap.set(nodeId, stripComputedFields({ ...node, data: { ...node.data, ...patch } }));
            }
        },
        [ydocRef],
    )

    return { updateNodeData, updateEdgeData, updateNodeAndSingleEdgeData };
}