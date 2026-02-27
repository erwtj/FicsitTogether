import type { Node } from "@xyflow/react";

export function generateNodeId() {
    return `node-${crypto.randomUUID().replace('-', '')}`;
}

// Handle id convention: `node-<nodeId>-(input|output)-handle-<index>`
export function getItemIndexFromHandleId(handleId: string) {
    return parseInt(handleId?.split("-")[4] ?? "-1", 10);
}

/**
 * Returns a copy of `node` with all `_`-prefixed keys removed from `data`.
 * Call this before writing any node into the Yjs map so computed-only fields
 * (e.g. `_factor`, `_outputOverUsed`) are never persisted or broadcast.
 */
export function stripComputedFields<T extends Node>(node: T): T {
    if (!node.data) return node;
    const cleanData = Object.fromEntries(
        Object.entries(node.data as Record<string, unknown>).filter(([k]) => !k.startsWith("_"))
    );
    return { ...node, data: cleanData };
}
