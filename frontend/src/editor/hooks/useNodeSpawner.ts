import { useCallback } from "react";
import * as Y from "yjs";
import { type Edge } from "@xyflow/react";
import { getRecipe } from "ficlib";
import { MAX_CHART_NODES, MAX_CHART_EDGES } from "dtolib";
import {
    type AppNode,
    type ItemEdgeData,
    type RecipeNodeData,
    type ItemSpawnerNodeData,
    type EndNodeData,
    type PowerNodeData,
} from "../types";
import {generateEdgeId, generateNodeId, stripComputedFields} from "../utils/idUtils";
import { getHandleItemClassName } from "../utils/throughput";

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

            // Enforce chart limits
            if (nodeMap.size >= MAX_CHART_NODES) return;
            if (pendingConnection && edgeMap.size >= MAX_CHART_EDGES) return;

            // -- Build node ------------------------------------------------
            let newNode: AppNode | null = null;

            if (type === "recipe")
                newNode = { id: nodeId, type: "recipe-node", position, data: { recipeClassName: className, somersloops: 0, percentage: [] } as RecipeNodeData };
            else if (type === "item-spawner")
                newNode = { id: nodeId, type: "item-spawner-node", position, data: { itemClassName: className, outputAmount: pendingConnection?.throughput ?? 0 } as ItemSpawnerNodeData };
            else if (type === "item-end")
                newNode = { id: nodeId, type: "end-node", position, data: { itemClassName: className } as EndNodeData };
            else if (type === "power")
                newNode = { id: nodeId, type: "power-node", position, data: { recipeClassName: className } as PowerNodeData };

            if (!newNode) return;

            doc.transact(() => {
                nodeMap.set(nodeId, stripComputedFields(newNode!));
                if (!pendingConnection) return;

                const { nodeId: existingId, handleId, handleType, throughput } = pendingConnection;

                // Find the matching handle on the new node
                let newNodeHandle: string | null = null;

                if (type === "recipe") {
                    const recipe = getRecipe(className);
                    if (!recipe) return;

                    // Read the item class from the existing node via Yjs
                    const existingNode = doc.getMap<AppNode>("nodes").get(existingId);
                    const existingItemClass = getHandleItemClassName(existingNode as AppNode, handleId, handleType);

                    if (handleType === "source") {
                        const idx = recipe.input.findIndex(i => i.name === existingItemClass);
                        if (idx === -1) return;
                        newNodeHandle = `${nodeId}-input-handle-${idx}`;
                    } else {
                        const idx = recipe.output.findIndex(o => o.name === existingItemClass);
                        if (idx === -1) return;
                        newNodeHandle = `${nodeId}-output-handle-${idx}`;
                    }
                } else {
                    // item-spawner, item-end, power all have a single handle at index 0
                    newNodeHandle = handleType === "source"
                        ? `${nodeId}-input-handle-0`
                        : `${nodeId}-output-handle-0`;
                }

                if (!newNodeHandle) return;

                const [source, target, sourceHandle, targetHandle] = handleType === "source"
                    ? [existingId, nodeId, handleId, newNodeHandle]
                    : [nodeId, existingId, newNodeHandle, handleId];

                const edgeId = generateEdgeId();

                edgeMap.set(edgeId, {
                    id: edgeId,
                    type: "item-edge",
                    source, target, sourceHandle, targetHandle,
                    data: { throughput },
                });
            });
        },
        [ydocRef],
    );

    return { spawnNode };
}

