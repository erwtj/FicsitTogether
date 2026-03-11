import { useEffect, useRef } from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import {getItem, getRecipe } from "ficlib";
import { computeNodeFactor, totalThroughputForHandle } from "../utils/factoryCalc";
import {
    type ItemEdgeData,
    type RecipeNodeData,
    type ItemSpawnerNodeData,
    type PowerNodeData,
    type EndNodeData,
} from "../types";
import { getItemIndexFromHandleId } from "../utils/idUtils";

/**
 * Build a cheap string fingerprint of the semantic data fields we care about
 * for each node (excludes position, width, height, selected, and _ computed fields).
 * Used to detect real data changes without triggering on drag moves.
 */
function nodeDataFingerprint(nodes: Node[]): string {
    return nodes.map(n => {
        if (n.type === "item-spawner-node") {
            const d = n.data as ItemSpawnerNodeData;
            return `${n.id}:${d.outputAmount}`;
        }
        if (n.type === "recipe-node") {
            const d = n.data as RecipeNodeData;
            const sloopDataStr = d.sloopData?.map(
                (data => `${data.sloopAmount}-${data.overclockPercentage}`)).join(",")
                ?? "";
            return `${n.id}:${d.recipeClassName}:${sloopDataStr}`;
        }
        if (n.type === "power-node") {
            const d = n.data as PowerNodeData;
            return `${n.id}:${d.recipeClassName}`;
        }
        return n.id;
    }).join("|");
}

/**
 * Watches for edge OR relevant node-data changes and pushes computed factors
 * into affected node data using reactFlow.setNodes.
 *
 * The update is one-directional:
 *   (edge change OR node data change) -> setNodes with computed _ fields (local only, NOT written to Yjs)
 * The _ fields do NOT feed back into this hook, so there is no circular loop.
 */
export function useFactorySync(
    edges: Edge<ItemEdgeData>[],
    nodes: Node[],
) {
    const reactFlow = useReactFlow();

    const isSyncing = useRef(false);
    const prevEdgesRef = useRef<Edge<ItemEdgeData>[]>([]);
    const prevNodeFingerprintRef = useRef<string>("");

    useEffect(() => {
        const fingerprint = nodeDataFingerprint(nodes);
        const edgesChanged = prevEdgesRef.current !== edges;
        const nodesChanged = prevNodeFingerprintRef.current !== fingerprint;

        if (!edgesChanged && !nodesChanged) return;

        prevEdgesRef.current = edges;
        prevNodeFingerprintRef.current = fingerprint;

        if (isSyncing.current) return;
        isSyncing.current = true;

        reactFlow.setNodes((currentNodes: Node[]) => {
            let changed = false;
            const nextNodes = currentNodes.map((node) => {
                const nodeEdges = edges.filter(
                    (e) => e.source === node.id || e.target === node.id,
                );
                const incomingEdges = nodeEdges.filter((e) => e.target === node.id);
                const outgoingEdges = nodeEdges.filter((e) => e.source === node.id);

                if (node.type === "item-spawner-node") {
                    const d = node.data as ItemSpawnerNodeData;
                    const handleId = `${node.id}-output-handle-0`;
                    const usedOut = totalThroughputForHandle(outgoingEdges, handleId, "source");
                    const overUsed = usedOut > d.outputAmount + 0.001;
                    const prevOverUsed = d._outputOverUsed?.[handleId];
                    if (prevOverUsed === overUsed) return node;
                    changed = true;
                    return {
                        ...node,
                        data: { ...d, _outputOverUsed: { [handleId]: overUsed } },
                    };
                }

                if (node.type === "recipe-node") {
                    const d = node.data as RecipeNodeData;
                    const recipe = getRecipe(d.recipeClassName);
                    if (!recipe) return node;

                    const factor = computeNodeFactor(
                        recipe,
                        d.sloopData,
                        incomingEdges,
                        outgoingEdges,
                    );

                    const rawFactor = computeNodeFactor(
                        recipe,
                        d.sloopData,
                        incomingEdges,
                        outgoingEdges,
                        true
                    );

                    const outputOverUsed: Record<string, boolean> = {};
                    recipe.output.forEach((output, i) => {
                        const handleId = `${node.id}-output-handle-${i}`;
                        const maxOut = output.amount * (60 / recipe.duration) * factor.outputFactor;
                        const usedOut = totalThroughputForHandle(outgoingEdges, handleId, "source");
                        outputOverUsed[handleId] = usedOut > maxOut + 0.001;
                    });

                    const prevFactor = d._factor;
                    const prevRawFactor = d._rawFactor;
                    const prevOverUsed = d._outputOverUsed;

                    const factorChanged =
                        !prevFactor ||
                        prevFactor.inputFactor !== factor.inputFactor ||
                        prevFactor.outputFactor !== factor.outputFactor;
                    const rawFactorChanged =
                        !prevRawFactor ||
                        prevRawFactor.inputFactor !== rawFactor.inputFactor ||
                        prevRawFactor.outputFactor !== rawFactor.outputFactor;
                    const overUsedChanged =
                        !prevOverUsed ||
                        Object.keys(outputOverUsed).some(
                            (k) => outputOverUsed[k] !== prevOverUsed[k],
                        );

                    if (!factorChanged && !overUsedChanged && !rawFactorChanged) return node;

                    changed = true;
                    return {
                        ...node,
                        data: { ...d, _factor: factor, _rawFactor: rawFactor, _outputOverUsed: outputOverUsed },
                    };
                }

                if (node.type === "end-node") {
                    const d = node.data as EndNodeData;
                    const total = incomingEdges.reduce(
                        (s, e) => s + (e.data?.throughput ?? 0),
                        0,
                    );
                    if (d._totalThroughput === total) return node;
                    changed = true;

                    const sinkFactor = getItem(d.itemClassName)?.resourceSinkPoints ?? 0;
                    const totalSink = total * sinkFactor;
                    return { ...node, data: { ...d, _totalThroughput: total, _totalSinkPoints: totalSink } };
                }

                if (node.type === "power-node") {
                    const d = node.data as PowerNodeData;
                    const recipe = getRecipe(d.recipeClassName);
                    if (!recipe) return node;

                    const craftsPerMinute = 60 / recipe.duration;
                    const throughputByHandle = new Map<string, number>();
                    for (const edge of incomingEdges) {
                        const h = edge.targetHandle ?? "";
                        throughputByHandle.set(
                            h,
                            (throughputByHandle.get(h) ?? 0) + (edge.data?.throughput ?? 0),
                        );
                    }

                    let lowestFactor = 1;
                    if (throughputByHandle.size > 0) {
                        lowestFactor = Infinity;
                        throughputByHandle.forEach((throughput, handleId) => {
                            const idx = getItemIndexFromHandleId(handleId);
                            const input = recipe.input[idx];
                            if (!input) return;
                            const required = input.amount * craftsPerMinute;
                            if (required > 0)
                                lowestFactor = Math.min(lowestFactor, throughput / required);
                        });
                        if (!isFinite(lowestFactor)) lowestFactor = 1;
                    }

                    if (d._factor === lowestFactor) return node;
                    changed = true;
                    return { ...node, data: { ...d, _factor: lowestFactor } };
                }

                return node;
            });

            isSyncing.current = false;
            return changed ? nextNodes : currentNodes;
        });

        isSyncing.current = false;
    }, [edges, nodes, reactFlow]);
}
