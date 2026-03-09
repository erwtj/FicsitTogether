import { type Edge } from "@xyflow/react";
import { type ItemEdgeData } from "../types";

/**
 * Equality function for useStore edge selectors.
 * Returns true (no re-render) when only edge positions changed —
 * i.e. only re-renders when throughput, connections, or edge count changes.
 */
export function edgesEqual(prev: Edge<ItemEdgeData>[], next: Edge<ItemEdgeData>[]): boolean {
    if (prev.length !== next.length) return false;
    return prev.every((e, i) => {
        const n = next[i];
        return e.id === n.id
            && e.source === n.source
            && e.target === n.target
            && e.sourceHandle === n.sourceHandle
            && e.targetHandle === n.targetHandle
            && (e.data?.throughput ?? 0) === (n.data?.throughput ?? 0);
    });
}