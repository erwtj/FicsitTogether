import { type EdgeTypes } from "@xyflow/react";
import { ItemEdge } from "./ItemEdge";

/**
 * Pass this object directly to <ReactFlow edgeTypes={edgeTypes} />.
 * Defined outside any component so the reference is stable.
 */
export const edgeTypes: EdgeTypes = {
    "item-edge": ItemEdge,
};