import { type Node, type Edge } from "@xyflow/react";
import type {
    SloopData as SloopDataDTO,
    RecipeNodeData as RecipeNodeDataDTO,
    ItemSpawnerNodeData as ItemSpawnerNodeDataDTO,
    EndNodeData as EndNodeDataDTO,
    PowerNodeData as PowerNodeDataDTO,
} from "dtolib";

// Classnames are looked up via getWhatever() from ficlib
export type SloopData = {} & SloopDataDTO;

export type RecipeNodeData = {
    _factor?: NodeFactor; // Computed input/output factor based on building count and Somer Sloop bonus. Never written to Yjs
    _rawFactor?: NodeFactor; // Factor without Somer Sloop bonus. Never written to Yjs
    _outputOverUsed?: Record<string, boolean>; // Per-output-handle over-capacity flags. Key = handleId. Never written to Yjs
} & RecipeNodeDataDTO;

export type ItemSpawnerNodeData = {
    _outputOverUsed?: Record<string, boolean>; // Per-output-handle over-capacity flags. Key = handleId. Never written to Yjs
} & ItemSpawnerNodeDataDTO;

export type EndNodeData = {
    _totalThroughput?: number; // Total throughput flowing in. Never written to Yjs
    _totalSinkPoints?: number; // Total sink points flowing in (throughput * item sink points). Never written to Yjs
} & EndNodeDataDTO;

export type PowerNodeData = {
    _factor?: number; // Computed clock factor. Never written to Yjs
} & PowerNodeDataDTO;

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
    // Relative position along the source-target axis (0 = source, 1 = target)
    t: number;
    // Offset from the interpolated point on the source-target line
    dx: number;
    dy: number;
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