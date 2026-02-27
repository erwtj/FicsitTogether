import { useEffect, useRef } from "react";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import { getRecipe } from "ficlib";
import { computeNodeFactor, totalThroughputForHandle } from "../utils/factoryCalc";
import {
    type ItemEdgeData,
    type RecipeNodeData,
    type PowerNodeData,
    type EndNodeData,
} from "../types";
import { getItemIndexFromHandleId } from "../utils/idUtils";

/**
 * Watches for edge changes (via a polling comparison on edges array identity)
 * and pushes computed factors into affected node data using reactFlow.setNodes.
 *
 * This is the ONLY place where edge throughput → node factor derivation happens.
 * Nodes no longer subscribe to the edge store; they just read their own data prop.
 *
 * The update is one-directional:
 *   edge change → node data update (via setNodes, local only, NOT written to Yjs)
 * Node data changes do NOT trigger another edge/node round-trip (no circular loop).
 */
export function useFactorySync(
    edges: Edge<ItemEdgeData>[],
) {
    const reactFlow = useReactFlow();

    // Prevent re-entrancy: if setNodes triggers a re-render that somehow
    // loops back here before we're done, skip it.
    const isSyncing = useRef(false);

    // Track previous edges reference so we only recompute when edges actually change
    const prevEdgesRef = useRef<Edge<ItemEdgeData>[]>([]);

    useEffect(() => {
        // Skip if edges reference hasn't changed (position-only node moves don't change edges)
        if (prevEdgesRef.current === edges) return;
        prevEdgesRef.current = edges;

        if (isSyncing.current) return;
        isSyncing.current = true;

        reactFlow.setNodes((nodes: Node[]) => {
            let changed = false;
            const nextNodes = nodes.map((node) => {
                const nodeEdges = edges.filter(
                    (e) => e.source === node.id || e.target === node.id,
                );
                const incomingEdges = nodeEdges.filter((e) => e.target === node.id);
                const outgoingEdges = nodeEdges.filter((e) => e.source === node.id);

                if (node.type === "recipe-node") {
                    const d = node.data as RecipeNodeData;
                    const recipe = getRecipe(d.recipeClassName);
                    if (!recipe) return node;

                    const factor = computeNodeFactor(
                        recipe,
                        d.summerSloops,
                        d.percentage,
                        incomingEdges,
                        outgoingEdges,
                    );

                    // Compute per-handle over-capacity flags
                    const outputOverUsed: Record<string, boolean> = {};
                    recipe.output.forEach((output, i) => {
                        const handleId = `${node.id}-output-handle-${i}`;
                        const maxOut = output.amount * (60 / recipe.duration) * factor.outputFactor;
                        const usedOut = totalThroughputForHandle(outgoingEdges, handleId, "source");
                        outputOverUsed[handleId] = usedOut > maxOut + 0.001;
                    });

                    // Shallow compare to avoid unnecessary node object replacement
                    const prevFactor = d._factor;
                    const prevOverUsed = d._outputOverUsed;
                    const factorChanged =
                        !prevFactor ||
                        prevFactor.inputFactor !== factor.inputFactor ||
                        prevFactor.outputFactor !== factor.outputFactor;
                    const overUsedChanged =
                        !prevOverUsed ||
                        Object.keys(outputOverUsed).some(
                            (k) => outputOverUsed[k] !== prevOverUsed[k],
                        );

                    if (!factorChanged && !overUsedChanged) return node;

                    changed = true;
                    return {
                        ...node,
                        data: {
                            ...d,
                            _factor: factor,
                            _outputOverUsed: outputOverUsed,
                        },
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
                    return { ...node, data: { ...d, _totalThroughput: total } };
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
            return changed ? nextNodes : nodes;
        });

        // isSyncing is cleared inside setNodes callback; also clear here as fallback
        // in case setNodes was synchronous and already cleared it.
        isSyncing.current = false;
    }, [edges, reactFlow]);
}

