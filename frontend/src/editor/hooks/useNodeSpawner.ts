import { useCallback } from "react";
import * as Y from "yjs";
import { type Edge } from "@xyflow/react";
import { getRecipe } from "ficlib";
import {
    type AppNode,
    type ItemEdgeData,
    type RecipeNodeData,
    type ItemSpawnerNodeData,
    type EndNodeData,
    type PowerNodeData,
} from "../types";
import {generateNodeId, getItemIndexFromHandleId} from "../utils/idUtils.ts";

type SpawnType = "recipe" | "item-spawner" | "item-end" | "power";
type Position = { x: number; y: number };

/** Info about the handle the user dragged from, used to auto-connect the new node. */
export type PendingConnection = {
    nodeId: string;
    handleId: string;
    handleType: "source" | "target";
    /** Pre-computed throughput to assign to the new edge */
    throughput: number;
};

export function useNodeSpawner(ydocRef: React.RefObject<Y.Doc | null>) {
    /**
     * Spawn a node of the given type at `position`.
     * If `pendingConnection` is provided, also creates the connecting edge.
     */
    const spawnNode = useCallback(
        (
            type: SpawnType,
            className: string,
            position: Position,
            pendingConnection: PendingConnection | null = null,
        ) => {
            const doc = ydocRef.current;
            if (!doc) return;

            const nodeId = generateNodeId();
            const nodeMap = doc.getMap<AppNode>("nodes");
            const edgeMap = doc.getMap<Edge<ItemEdgeData>>("edges");

            // ── Build node data ────────────────────────────────────────────

            let newNode: AppNode | null = null;

            if (type === "recipe") {
                const data: RecipeNodeData = {
                    recipeClassName: className,
                    summerSloops: 0,
                    percentage: [],
                };
                newNode = { id: nodeId, type: "recipe-node", position, data };
            }

            if (type === "item-spawner") {
                // Throughput comes from the pending connection if dragging from an input
                const outputAmount = pendingConnection?.throughput ?? 0;
                const data: ItemSpawnerNodeData = { itemClassName: className, outputAmount };
                newNode = { id: nodeId, type: "item-spawner-node", position, data };
            }

            if (type === "item-end") {
                const data: EndNodeData = { itemClassName: className };
                newNode = { id: nodeId, type: "end-node", position, data };
            }

            if (type === "power") {
                const data: PowerNodeData = { recipeClassName: className };
                newNode = { id: nodeId, type: "power-node", position, data };
            }

            if (!newNode) return;

            doc.transact(() => {
                nodeMap.set(nodeId, newNode!);

                if (!pendingConnection) return;

                const { nodeId: existingId, handleId, handleType, throughput } = pendingConnection;

                // Determine which handle on the new node to connect to
                let newNodeHandle: string | null = null;

                if (type === "recipe") {
                    const recipe = getRecipe(className);
                    if (!recipe) return;

                    if (handleType === "source") {
                        // Existing node has an output → new node needs a matching input
                        const existingItemClass = resolveHandleItemClass(doc, existingId, handleId, "source");
                        const inputIdx = recipe.input.findIndex(i => i.name === existingItemClass);
                        if (inputIdx === -1) return;
                        newNodeHandle = `${nodeId}-input-handle-${inputIdx}`;
                    } else {
                        // Existing node has an input → new node needs a matching output
                        const existingItemClass = resolveHandleItemClass(doc, existingId, handleId, "target");
                        const outputIdx = recipe.output.findIndex(o => o.name === existingItemClass);
                        if (outputIdx === -1) return;
                        newNodeHandle = `${nodeId}-output-handle-${outputIdx}`;
                    }
                } else {
                    // item-spawner, item-end, power all have a single handle at index 0
                    newNodeHandle = handleType === "source"
                        ? `${nodeId}-input-handle-0`
                        : `${nodeId}-output-handle-0`;
                }
                
                if (!newNodeHandle) return;

                const [source, target, sourceHandle, targetHandle] =
                    handleType === "source"
                        ? [existingId, nodeId, handleId, newNodeHandle]
                        : [nodeId, existingId, newNodeHandle, handleId];

                const newEdge: Edge<ItemEdgeData> = {
                    id: `edge-${Date.now()}`,
                    type: "item-edge",
                    source,
                    target,
                    sourceHandle,
                    targetHandle,
                    data: { throughput },
                };

                edgeMap.set(newEdge.id, newEdge);
            });
        },
        [ydocRef],
    );

    return { spawnNode };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the item className that a handle on an already-existing node carries.
 * Reads directly from the Yjs doc so it works without React state.
 */
function resolveHandleItemClass(
    doc: Y.Doc,
    nodeId: string,
    handleId: string,
    handleType: "source" | "target",
): string | null {
    const node = doc.getMap<AppNode>("nodes").get(nodeId);
    if (!node) return null;

    const idx = getItemIndexFromHandleId(handleId);
    if (isNaN(idx) || idx < 0) return null;

    if (node.type === "recipe-node") {
        const recipe = getRecipe((node.data as RecipeNodeData).recipeClassName);
        if (!recipe) return null;
        return handleType === "source"
            ? recipe.output[idx]?.name ?? null
            : recipe.input[idx]?.name ?? null;
    }

    if (node.type === "item-spawner-node") {
        return (node.data as ItemSpawnerNodeData).itemClassName;
    }
    
    if (node.type === "end-node") {
        return (node.data as EndNodeData).itemClassName;
    } 
    
    if (node.type === "power-node") {
        const recipe = getRecipe((node.data as PowerNodeData).recipeClassName);
        if (!recipe) return null;
        return recipe.input[idx]?.name ?? null;
    } 

    return null;
}