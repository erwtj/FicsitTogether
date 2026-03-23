import { useCallback } from "react";
import { useReactFlow, type IsValidConnection } from "@xyflow/react";
import { getHandleItemClassName } from "../utils/throughput";

/**
 * Returns a stable `isValidConnection` callback for <ReactFlow>.
 * Prevents connecting handles that carry different item types.
 */
export function useConnectionValidation() {
    const reactFlow = useReactFlow();

    const isValidConnection = useCallback<IsValidConnection>(
        ({ source, target, sourceHandle, targetHandle }) => {
            const sourceNode = reactFlow.getNode(source ?? "");
            const targetNode = reactFlow.getNode(target ?? "");

            if (!sourceNode || !targetNode) return false;
            
            const existingEdge = reactFlow.getEdges().some(edge => edge.targetHandle === targetHandle && edge.sourceHandle === sourceHandle);
            if (existingEdge) return false; // Prevent multiple edges between the same handles

            const sourceItem = getHandleItemClassName(sourceNode, sourceHandle, "source");
            const targetItem = getHandleItemClassName(targetNode, targetHandle, "target");

            return !!sourceItem && !!targetItem && sourceItem === targetItem;
        },
        [reactFlow],
    );

    return { isValidConnection };
}