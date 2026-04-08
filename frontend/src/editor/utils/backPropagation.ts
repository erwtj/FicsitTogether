import { type Edge, type Node } from "@xyflow/react";
import { getRecipe } from "ficlib";
import { computeNodeFactor } from "./factoryCalc";
import { getItemIndexFromHandleId } from "./idUtils";
import {
    type AppNode,
    type ItemEdgeData,
    type RecipeNodeData,
} from "../types";

type GraphPatchSet = {
    edgePatches: Record<string, Partial<ItemEdgeData>>;
    nodePatches: Record<string, Record<string, unknown>>;
};

type AllocationTarget = {
    edgeId: string;
    currentThroughput: number;
};

type MutableGraph = {
    nodesById: Map<string, AppNode>;
    edgesById: Map<string, Edge<ItemEdgeData>>;
    originalThroughputs: Map<string, number>;
    edgeThroughputs: Map<string, number>;
    nodePatches: Record<string, Record<string, unknown>>;
    edgePatches: Record<string, Partial<ItemEdgeData>>;
};

function sumEdgeThroughput(
    edges: Edge<ItemEdgeData>[],
    edgeThroughputs: Map<string, number>,
): number {
    return edges.reduce((sum, edge) => sum + (edgeThroughputs.get(edge.id) ?? edge.data?.throughput ?? 0), 0);
}

function distributeTotal(
    targets: AllocationTarget[],
    total: number,
): Map<string, number> {
    const nextValues = new Map<string, number>();

    if (targets.length === 0) return nextValues;
    if (total <= 0) {
        for (const target of targets) nextValues.set(target.edgeId, 0);
        return nextValues;
    }

    const currentTotal = targets.reduce((sum, target) => sum + target.currentThroughput, 0);

    if (currentTotal <= 0) {
        const evenShare = total / targets.length;
        for (const target of targets) nextValues.set(target.edgeId, evenShare);
        return nextValues;
    }

    for (const target of targets) {
        nextValues.set(target.edgeId, total * (target.currentThroughput / currentTotal));
    }

    return nextValues;
}

function getOriginalThroughput(graph: MutableGraph, edgeId: string): number {
    const edge = graph.edgesById.get(edgeId);
    if (!edge) return 0;
    return graph.originalThroughputs.get(edgeId) ?? edge.data?.throughput ?? 0;
}

function setEdgeThroughput(graph: MutableGraph, edgeId: string, throughput: number) {
    graph.edgeThroughputs.set(edgeId, throughput);
    graph.edgePatches[edgeId] = { ...(graph.edgePatches[edgeId] ?? {}), throughput };
}

function setNodePatch(graph: MutableGraph, nodeId: string, patch: Record<string, unknown>) {
    graph.nodePatches[nodeId] = { ...(graph.nodePatches[nodeId] ?? {}), ...patch };
}

function getNodeOutgoingEdges(graph: MutableGraph, nodeId: string): Edge<ItemEdgeData>[] {
    return [...graph.edgesById.values()].filter((edge) => edge.source === nodeId);
}

function getNodeIncomingEdges(graph: MutableGraph, nodeId: string): Edge<ItemEdgeData>[] {
    return [...graph.edgesById.values()].filter((edge) => edge.target === nodeId);
}

function propagateFromEdge(
    graph: MutableGraph,
    edgeId: string,
    desiredThroughput: number,
    visitingNodes: Set<string>,
): boolean {
    const edge = graph.edgesById.get(edgeId);
    if (!edge) return false;

    setEdgeThroughput(graph, edgeId, desiredThroughput);

    const sourceNode = graph.nodesById.get(edge.source);
    if (!sourceNode) return false;

    if (sourceNode.type === "item-spawner-node") {
        const outgoingEdges = getNodeOutgoingEdges(graph, sourceNode.id);
        const totalOutgoing = sumEdgeThroughput(outgoingEdges, graph.edgeThroughputs);
        setNodePatch(graph, sourceNode.id, { outputAmount: totalOutgoing });
        return true;
    }

    if (sourceNode.type !== "recipe-node") {
        return false;
    }

    if (visitingNodes.has(sourceNode.id)) {
        return true;
    }

    visitingNodes.add(sourceNode.id);

    const recipeData = sourceNode.data as RecipeNodeData;
    const recipe = getRecipe(recipeData.recipeClassName);
    if (!recipe) {
        visitingNodes.delete(sourceNode.id);
        return false;
    }

    const incomingEdges = getNodeIncomingEdges(graph, sourceNode.id);
    const outgoingEdges = getNodeOutgoingEdges(graph, sourceNode.id);
    const currentFactor = computeNodeFactor(recipe, recipeData.sloopData, incomingEdges, outgoingEdges);
    const craftsPerMinute = 60 / recipe.duration;
    const editedHandleId = edge.sourceHandle ?? "";
    const editedHandleIndex = getItemIndexFromHandleId(editedHandleId);
    const editedOutput = recipe.output[editedHandleIndex];

    if (!editedOutput) {
        visitingNodes.delete(sourceNode.id);
        return false;
    }

    const editedHandleEdges = outgoingEdges.filter((outgoingEdge) => outgoingEdge.sourceHandle === editedHandleId);
    const desiredEditedHandleTotal = sumEdgeThroughput(editedHandleEdges, graph.edgeThroughputs);
    const outputRateAtOne = editedOutput.amount * craftsPerMinute;
    const desiredOutputFactor = outputRateAtOne > 0 ? desiredEditedHandleTotal / outputRateAtOne : 0;
    const factorScale = currentFactor.outputFactor > 0 ? desiredOutputFactor / currentFactor.outputFactor : 1;
    const desiredInputFactor = currentFactor.outputFactor > 0
        ? currentFactor.inputFactor * factorScale
        : desiredOutputFactor;

    for (let outputIndex = 0; outputIndex < recipe.output.length; outputIndex++) {
        const outputHandleId = `${sourceNode.id}-output-handle-${outputIndex}`;
        const handleEdges = outgoingEdges.filter((outgoingEdge) => outgoingEdge.sourceHandle === outputHandleId);
        if (handleEdges.length === 0) continue;

        const output = recipe.output[outputIndex];
        const targetHandleTotal = output.amount * craftsPerMinute * desiredOutputFactor;

        if (outputHandleId === editedHandleId) {
            const remainingEdges = handleEdges
                .filter((handleEdge) => handleEdge.id !== edgeId)
                .map((handleEdge) => ({
                    edgeId: handleEdge.id,
                    currentThroughput: getOriginalThroughput(graph, handleEdge.id),
                }));
            const remainingTotal = Math.max(0, targetHandleTotal - desiredThroughput);
            const remainingDistribution = distributeTotal(remainingEdges, remainingTotal);
            for (const [remainingEdgeId, throughput] of remainingDistribution.entries()) {
                setEdgeThroughput(graph, remainingEdgeId, throughput);
            }
            continue;
        }

        const distribution = distributeTotal(
            handleEdges.map((handleEdge) => ({
                edgeId: handleEdge.id,
                currentThroughput: getOriginalThroughput(graph, handleEdge.id),
            })),
            targetHandleTotal,
        );

        for (const [outputEdgeId, throughput] of distribution.entries()) {
            setEdgeThroughput(graph, outputEdgeId, throughput);
        }
    }

    for (let inputIndex = 0; inputIndex < recipe.input.length; inputIndex++) {
        const inputHandleId = `${sourceNode.id}-input-handle-${inputIndex}`;
        const handleEdges = incomingEdges.filter((incomingEdge) => incomingEdge.targetHandle === inputHandleId);
        if (handleEdges.length === 0) continue;

        const input = recipe.input[inputIndex];
        const targetInputTotal = input.amount * craftsPerMinute * desiredInputFactor;
        const distribution = distributeTotal(
            handleEdges.map((handleEdge) => ({
                edgeId: handleEdge.id,
                currentThroughput: getOriginalThroughput(graph, handleEdge.id),
            })),
            targetInputTotal,
        );

        for (const [inputEdgeId, throughput] of distribution.entries()) {
            if (!propagateFromEdge(graph, inputEdgeId, throughput, visitingNodes)) {
                visitingNodes.delete(sourceNode.id);
                return false;
            }
        }
    }

    visitingNodes.delete(sourceNode.id);
    return true;
}

export function buildBackPropagationPatch(
    nodes: Node[],
    edges: Edge<ItemEdgeData>[],
    edgeId: string,
    desiredThroughput: number,
): GraphPatchSet | null {
    const nodesById = new Map(nodes.map((node) => [node.id, node as AppNode]));
    const edgesById = new Map(edges.map((edge) => [edge.id, edge as Edge<ItemEdgeData>]));
    const graph: MutableGraph = {
        nodesById,
        edgesById,
        originalThroughputs: new Map(edges.map((edge) => [edge.id, edge.data?.throughput ?? 0])),
        edgeThroughputs: new Map(edges.map((edge) => [edge.id, edge.data?.throughput ?? 0])),
        nodePatches: {},
        edgePatches: {},
    };

    const success = propagateFromEdge(graph, edgeId, desiredThroughput, new Set<string>());
    if (!success) return null;

    return {
        edgePatches: graph.edgePatches,
        nodePatches: graph.nodePatches,
    };
}