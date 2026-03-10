import { type Node, type Edge } from "@xyflow/react";

// Classnames are looked up via getWhatever() from ficlib

export type SloopData = {
    sloopAmount: number;
    overclockPercentage: number;
}

export type RecipeNodeData = {
    recipeClassName: string;
    sloopData?: SloopData[]

    _factor?: NodeFactor; // Computed input/output factor based on building count and Somer Sloop bonus. Never written to Yjs
    _rawFactor?: NodeFactor; // Factor without Somer Sloop bonus. Never written to Yjs
    _outputOverUsed?: Record<string, boolean>; // Per-output-handle over-capacity flags. Key = handleId. Never written to Yjs
    _inputTooLow?: Record<string, boolean>; // Per-input-handle assigned boolean. Key = handleId. Never written to Yjs
};

export type ItemSpawnerNodeData = {
    itemClassName: string;
    outputAmount: number; // Items (or mL for fluids) per minute this node provides
    _outputOverUsed?: Record<string, boolean>; // Per-output-handle over-capacity flags. Key = handleId. Never written to Yjs
};

export type EndNodeData = {
    itemClassName: string;
    sinkOutput: boolean;
    _totalThroughput?: number; // Total throughput flowing in. Never written to Yjs
    _totalSinkPoints?: number; // Total sink points flowing in (throughput * item sink points). Never written to Yjs
};

export type PowerNodeData = {
    recipeClassName: string;
    _factor?: number; // Computed clock factor. Never written to Yjs
};

export type RecipeNodeType     = Node<RecipeNodeData,      "recipe-node">;
export type ItemSpawnerNodeType = Node<ItemSpawnerNodeData, "item-spawner-node">;
export type EndNodeType        = Node<EndNodeData,          "end-node">;
export type PowerNodeType      = Node<PowerNodeData,        "power-node">;

export type AppNode =
    | RecipeNodeType
    | ItemSpawnerNodeType
    | EndNodeType
    | PowerNodeType;

export type MovablePoint = {
    id: string;
    x: number;
    y: number;
}

export type ItemEdgeData = {
    throughput: number;
    movablePoints?: MovablePoint[]
};

export type ItemEdgeType = Edge<ItemEdgeData, "item-edge">;

// inputFactor: number of buildings running; outputFactor: includes Somer Sloop bonus
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