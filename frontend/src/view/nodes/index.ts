import { type NodeTypes } from "@xyflow/react";
import { RecipeNode }      from "./RecipeNode";
import { ItemSpawnerNode } from "./ItemSpawnerNode.tsx";
import { EndNode }         from "./EndNode";
import { PowerNode }       from "./PowerNode";

// TODO: We are rebuilding all the nodes, just without the yjs and editing capabilities. It would be better if we created a base node that had all the shared functionality and then just extended it for the different node types. This would reduce code duplication and make it easier to maintain.
export const nodeTypes: NodeTypes = {
    "recipe-node":       RecipeNode,
    "item-spawner-node": ItemSpawnerNode,
    "end-node":          EndNode,
    "power-node":        PowerNode,
};