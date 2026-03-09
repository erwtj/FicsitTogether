import { type NodeTypes } from "@xyflow/react";
import { RecipeNode }      from "./RecipeNode";
import { ItemSpawnerNode } from "./ItemSpawnerNode";
import { EndNode }         from "./EndNode";
import { PowerNode }       from "./PowerNode";

/**
 * Pass this object directly to <ReactFlow nodeTypes={nodeTypes} />.
 * Defined outside any component so the reference is stable.
 */
// TODO: item-extractor-node
export const nodeTypes: NodeTypes = {
    "recipe-node":       RecipeNode,
    "item-spawner-node": ItemSpawnerNode,
    "end-node":          EndNode,
    "power-node":        PowerNode,
};