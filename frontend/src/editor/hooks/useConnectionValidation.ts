import { useCallback } from "react";
import { useReactFlow, type IsValidConnection } from "@xyflow/react";
import { getRecipe } from "ficlib";
import {type RecipeNodeData, type ItemSpawnerNodeData, type EndNodeData, type PowerNodeData} from "../types";
import {getItemIndexFromHandleId} from "../utils/idUtils.ts";

/**
 * Returns the item classname that a given handle produces (source) or consumes (target).
 * Handle id convention: `node-<nodeId>-(input|output)-handle-<index>`
 */
function getHandleItemClassName(
    node: ReturnType<ReturnType<typeof useReactFlow>["getNode"]>,
    handleId: string | null | undefined,
    handleType: "source" | "target",
): string | null {
    if (!node || !handleId) return null;

    if (node.type === "recipe-node") {
        const { recipeClassName } = node.data as RecipeNodeData;
        const recipe = getRecipe(recipeClassName);
        
        if (!recipe) return null;

        const idx = getItemIndexFromHandleId(handleId);
        if (isNaN(idx) || idx < 0) return null;

        if (handleType === "source") {
            return recipe.output[idx]?.name ?? null;
        } else {
            return recipe.input[idx]?.name ?? null;
        }
    }

    if (node.type === "item-spawner-node") {
        // Only has one output handle; no input handles
        if (handleType === "source") {
            const { itemClassName } = node.data as ItemSpawnerNodeData;
            return itemClassName ?? null;
        }
        return null;
    }

    if (node.type === "end-node") {
        // Only has one input handle; no output handles
        if (handleType === "target") {
            const { itemClassName } = node.data as EndNodeData;
            return itemClassName ?? null;
        }
        return null;
    }

    if (node.type === "power-node") {
        if (handleType !== "target") 
            return null;
        
        const { recipeClassName } = node.data as PowerNodeData;
        const recipe = getRecipe(recipeClassName);

        if (!recipe) 
            return null;

        const idx = getItemIndexFromHandleId(handleId);
        if (isNaN(idx) || idx < 0) 
            return null;

        return recipe.input[idx]?.name ?? null;
    }

    return null;
}

/**
 * Returns a stable `isValidConnection` callback to pass to <ReactFlow>.
 * Prevents connecting handles that carry different item types.
 */
export function useConnectionValidation() {
    const reactFlow = useReactFlow();

    const isValidConnection = useCallback<IsValidConnection>(
        ({ source, target, sourceHandle, targetHandle }) => {
            const sourceNode = reactFlow.getNode(source ?? "");
            const targetNode = reactFlow.getNode(target ?? "");

            if (!sourceNode || !targetNode) return false;

            // Prevent self-connections
            if (source === target) return false;

            const sourceItemClass = getHandleItemClassName(sourceNode, sourceHandle, "source");
            const targetItemClass = getHandleItemClassName(targetNode, targetHandle, "target");

            // Either side unknown → block
            if (!sourceItemClass || !targetItemClass) return false;

            return sourceItemClass === targetItemClass;
        },
        [reactFlow],
    );

    return { isValidConnection };
}