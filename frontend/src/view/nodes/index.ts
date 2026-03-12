import { type NodeTypes } from "@xyflow/react";
import { RecipeNode }      from "./RecipeNode";
import { ItemSpawnerNode } from "./ItemSpawnerNode.tsx";
import { EndNode }         from "./EndNode";
import { PowerNode }       from "./PowerNode";

export const nodeTypes: NodeTypes = {
    "recipe-node":       RecipeNode,
    "item-spawner-node": ItemSpawnerNode,
    "end-node":          EndNode,
    "power-node":        PowerNode,
};