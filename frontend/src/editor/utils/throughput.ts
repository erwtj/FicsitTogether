/**
 * Pure helpers for computing throughput limits and usage on node handles.
 * These are used by both the connection handler (to pre-fill edge throughput)
 * and by useFactorySync (for over-capacity detection).
 */

import { type Node, type Edge } from "@xyflow/react";
import { getRecipe } from "ficlib";
import { computeNodeFactor } from "./factoryCalc";
import { getItemIndexFromHandleId } from "./idUtils";
import { type ItemEdgeData, type RecipeNodeData, type ItemSpawnerNodeData, type RecipeNodeType, type ItemSpawnerNodeType } from "../types";

/** Sum of throughput already assigned to outgoing edges on a specific source handle. */
export function usedSourceThroughput(
    edges: Edge<ItemEdgeData>[],
    sourceId: string,
    handleId: string,
): number {
    return edges
        .filter(e => e.source === sourceId && e.sourceHandle === handleId)
        .reduce((sum, e) => sum + (e.data?.throughput ?? 0), 0);
}

/** Sum of throughput already assigned to incoming edges on a specific target handle. */
export function usedTargetThroughput(
    edges: Edge<ItemEdgeData>[],
    targetId: string,
    handleId: string,
): number {
    return edges
        .filter(e => e.target === targetId && e.targetHandle === handleId)
        .reduce((sum, e) => sum + (e.data?.throughput ?? 0), 0);
}

/**
 * Maximum throughput a source handle can produce (items/min, raw units).
 * Returns null when the node type or handle index is not recognised.
 */
export function maxSourceThroughput(
    sourceNode: Node,
    sourceHandle: string,
    allEdges: Edge<ItemEdgeData>[],
): number | null {
    const handleIdx = getItemIndexFromHandleId(sourceHandle);

    if (sourceNode.type === "item-spawner-node") {
        return (sourceNode as ItemSpawnerNodeType).data.outputAmount;
    }

    if (sourceNode.type === "recipe-node") {
        const d = (sourceNode as RecipeNodeType).data as RecipeNodeData;
        const recipe = getRecipe(d.recipeClassName);
        if (!recipe) return null;

        const incomingEdges = allEdges.filter(e => e.target === sourceNode.id);
        const outgoingEdges = allEdges.filter(e => e.source === sourceNode.id);
        const factor = computeNodeFactor(recipe, d.somersloops, d.percentage, incomingEdges, outgoingEdges);

        const output = recipe.output[handleIdx];
        if (!output) return null;
        return output.amount * (60 / recipe.duration) * factor.outputFactor;
    }

    return null;
}

/**
 * Maximum throughput a target handle demands (items/min, raw units).
 * Returns null for end-node / power-node (they accept anything).
 */
export function maxTargetThroughput(
    targetNode: Node,
    targetHandle: string,
    allEdges: Edge<ItemEdgeData>[],
): number | null {
    if (targetNode.type !== "recipe-node") return null;

    const handleIdx = getItemIndexFromHandleId(targetHandle);
    const d = (targetNode as RecipeNodeType).data as RecipeNodeData;
    const recipe = getRecipe(d.recipeClassName);
    if (!recipe) return null;

    const incomingEdges = allEdges.filter(e => e.target === targetNode.id);
    const outgoingEdges = allEdges.filter(e => e.source === targetNode.id);
    const factor = computeNodeFactor(recipe, d.somersloops, d.percentage, incomingEdges, outgoingEdges);

    const input = recipe.input[handleIdx];
    if (!input) return null;
    return input.amount * (60 / recipe.duration) * factor.inputFactor;
}

/**
 * Returns the item className carried by a handle, given a node and handle id.
 * Used for connection validation and auto-connecting spawned nodes.
 */
export function getHandleItemClassName(
    node: Node | undefined,
    handleId: string | null | undefined,
    handleType: "source" | "target",
): string | null {
    if (!node || !handleId) return null;
    const idx = getItemIndexFromHandleId(handleId);

    if (node.type === "recipe-node") {
        const recipe = getRecipe((node.data as RecipeNodeData).recipeClassName);
        if (!recipe || isNaN(idx) || idx < 0) return null;
        return handleType === "source"
            ? recipe.output[idx]?.name ?? null
            : recipe.input[idx]?.name ?? null;
    }

    if (node.type === "item-spawner-node") {
        return handleType === "source"
            ? (node.data as ItemSpawnerNodeData).itemClassName ?? null
            : null;
    }

    if (node.type === "end-node") {
        return handleType === "target"
            ? (node.data as { itemClassName: string }).itemClassName ?? null
            : null;
    }

    if (node.type === "power-node") {
        if (handleType !== "target") return null;
        const recipe = getRecipe((node.data as { recipeClassName: string }).recipeClassName);
        if (!recipe || isNaN(idx) || idx < 0) return null;
        return recipe.input[idx]?.name ?? null;
    }

    return null;
}

