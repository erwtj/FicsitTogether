import { type Node, type Edge } from "@xyflow/react";

// ─── Node Data ────────────────────────────────────────────────────────────────

export type RecipeNodeData = {
    /** ClassName looked up via getRecipe() at render time */
    recipeClassName: string;
    summerSloops: number;
    percentage: number[];
};

export type ItemSpawnerNodeData = {
    /** ClassName looked up via getItem() at render time */
    itemClassName: string;
    /** Items (or mL for fluids) per minute this node provides */
    outputAmount: number;
};

export type EndNodeData = {
    itemClassName: string;
};

export type PowerNodeData = {
    recipeClassName: string;
};

// ─── Typed Nodes ─────────────────────────────────────────────────────────────

export type RecipeNodeType     = Node<RecipeNodeData,      "recipe-node">;
export type ItemSpawnerNodeType = Node<ItemSpawnerNodeData, "item-spawner-node">;
export type EndNodeType        = Node<EndNodeData,          "end-node">;
export type PowerNodeType      = Node<PowerNodeData,        "power-node">;

export type AppNode =
    | RecipeNodeType
    | ItemSpawnerNodeType
    | EndNodeType
    | PowerNodeType;

// ─── Edge Data ────────────────────────────────────────────────────────────────

export type ItemEdgeData = {
    /** Items (or mL for fluids) per minute flowing through this edge */
    throughput: number;
};

export type ItemEdgeType = Edge<ItemEdgeData, "item-edge">;

// ─── Factor ───────────────────────────────────────────────────────────────────

/** inputFactor: number of buildings running; outputFactor: includes Somer Sloop bonus */
export type NodeFactor = { inputFactor: number; outputFactor: number };