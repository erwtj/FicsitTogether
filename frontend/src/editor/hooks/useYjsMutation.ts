import { useCallback } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { useYjsDoc } from "../context/YjsContext";
import { stripComputedFields } from "../utils/idUtils";

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

    return { updateNodeData, updateEdgeData };
}