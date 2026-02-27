import { type Node, type Edge } from "@xyflow/react";

// ─── Node Data ────────────────────────────────────────────────────────────────

export type RecipeNodeData = {
    /** ClassName looked up via getRecipe() at render time */
    recipeClassName: string;
    summerSloops: number;
    percentage: number[];
    /**
     * Computed by useFactorySync — nodes read this instead of subscribing
     * to the edge store themselves. Never written to Yjs.
     */
    _factor?: NodeFactor;
    /** Per-output-handle over-capacity flags. Key = handleId. Never written to Yjs. */
    _outputOverUsed?: Record<string, boolean>;
};

export type ItemSpawnerNodeData = {
    /** ClassName looked up via getItem() at render time */
    itemClassName: string;
    /** Items (or mL for fluids) per minute this node provides */
    outputAmount: number;
};

export type EndNodeData = {
    itemClassName: string;
    /** Total throughput flowing in. Never written to Yjs. */
    _totalThroughput?: number;
};

export type PowerNodeData = {
    recipeClassName: string;
    /** Computed clock factor. Never written to Yjs. */
    _factor?: number;
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

export type MovablePoint = {
    id: string;
    x: number;
    y: number;
}

export type ItemEdgeData = {
    /** Items (or mL for fluids) per minute flowing through this edge */
    throughput: number;
    movablePoints?: MovablePoint[]
};

export type ItemEdgeType = Edge<ItemEdgeData, "item-edge">;

// ─── Factor ───────────────────────────────────────────────────────────────────

/** inputFactor: number of buildings running; outputFactor: includes Somer Sloop bonus */
export type NodeFactor = { inputFactor: number; outputFactor: number };

export const nodeColor = (node: Node) => {
    switch (node.type){
        case "recipe-node":
            return "#e2e2e2";
        case "item-spawner-node":
            return "#4CAF50";
        case "end-node":
            return "#FF9800";
        case "power-node":
            return "#FFEB3B";
        default:
            return "#ff0000";
    }
}