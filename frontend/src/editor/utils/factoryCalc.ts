import { type Edge } from "@xyflow/react";
import { type Recipe, getBuilding } from "ficlib";
import {type NodeFactor, type ItemEdgeData, type SloopData} from "../types";
import {getItemIndexFromHandleId} from "./idUtils.ts";

// ─── Slooping Calculations ─────────────────────────────────────────────────────────────
function inputBasedSloopingFactor(
    recipe: Recipe,
    sloopData: SloopData[],
    incomingEdges: Edge<ItemEdgeData>[],
): NodeFactor {
    const building = getBuilding(recipe.producedIn);
    const somersloopsNeeded = building?.somersloopsNeeded ?? 1;

    const inputFactor = inputBasedFactor(recipe, incomingEdges);
    const totalOverclockPercentage = sloopData.reduce((sum, data) => sum + data.overclockPercentage, 0);
    const missingInputFactor = inputFactor.inputFactor - (totalOverclockPercentage / 100);

    const totalEffectivePercentage = sloopData.reduce((sum, data) => sum + ((1 + (data.sloopAmount / somersloopsNeeded)) * data.overclockPercentage), 0);
    const outputFactor = totalEffectivePercentage > 0 ? totalEffectivePercentage / 100 : 1;

    if (inputFactor.inputFactor < 0 || outputFactor + missingInputFactor < 0) {
        return { inputFactor: 0, outputFactor: 0 };
    }

    return { inputFactor: inputFactor.inputFactor, outputFactor: outputFactor + missingInputFactor };
}

function outputBasedSloopingFactor(
    recipe: Recipe,
    sloopData: SloopData[],
    outgoingEdges: Edge<ItemEdgeData>[],
): NodeFactor {
    const building = getBuilding(recipe.producedIn);
    const somersloopsNeeded = building?.somersloopsNeeded ?? 1;

    const outputFactor = outputBasedFactor(recipe, outgoingEdges);
    const totalEffectivePercentage = sloopData.reduce((sum, data) => sum + ((1 + (data.sloopAmount / somersloopsNeeded)) * data.overclockPercentage), 0);
    const missingOutputFactor = outputFactor.outputFactor - (totalEffectivePercentage / 100);

    const totalOverclockPercentage = sloopData.reduce((sum, data) => sum + data.overclockPercentage, 0);
    const inputFactor = totalOverclockPercentage > 0 ? totalOverclockPercentage / 100 : 1;

    if (inputFactor + missingOutputFactor < 0 || outputFactor.outputFactor < 0) {
        return { inputFactor: 0, outputFactor: 0 };
    }

    return { inputFactor: inputFactor + missingOutputFactor, outputFactor: outputFactor.outputFactor };
}

function emptySloopingFactor(
    recipe: Recipe,
    sloopData: SloopData[]
): NodeFactor {
    const building = getBuilding(recipe.producedIn);
    const somersloopsNeeded = building?.somersloopsNeeded ?? 1;
    const totalOverclockPercentage = sloopData.reduce((sum, data) => sum + data.overclockPercentage, 0);
    const totalEffectivePercentage = sloopData.reduce((sum, data) => sum + ((1 + (data.sloopAmount / somersloopsNeeded)) * data.overclockPercentage), 0);
    const inputFactor = totalOverclockPercentage > 0 ? totalOverclockPercentage / 100 : 1;
    const outputFactor = totalEffectivePercentage > 0 ? totalEffectivePercentage / 100 : 1;

    return { inputFactor: inputFactor, outputFactor: outputFactor };
}



// ─── Main export ─────────────────────────────────────────────────────────────
/**
 * Compute the inputFactor / outputFactor for a recipe node given the current
 * edge throughputs.  This is a pure function so it can be called in a selector
 * or memoised however you like.
 *
 * Handle ids are expected to follow the pattern:  `<nodeId>-input-handle-<index>`
 * and `<nodeId>-output-handle-<index>` as produced by RecipeNode.
 */
export function computeNodeFactor(
    recipe: Recipe,
    sloopData: SloopData[] | undefined,
    incomingEdges: Edge<ItemEdgeData>[],
    outgoingEdges: Edge<ItemEdgeData>[],
    isRawFactor = false,
): NodeFactor {

    // ── Sloop-driven: calculate the factor based in slooping settings ──
    if (sloopData && sloopData.length > 0 && !isRawFactor) {
        if (incomingEdges.length > 0) return inputBasedSloopingFactor(recipe, sloopData, incomingEdges);
        if (outgoingEdges.length > 0) return outputBasedSloopingFactor(recipe, sloopData, outgoingEdges);
        return emptySloopingFactor(recipe, sloopData);
    }

    // ── Input-driven: group incoming throughput by target handle ──
    if (incomingEdges.length > 0) return inputBasedFactor(recipe, incomingEdges, isRawFactor);

    // ── Output-driven: infer factor from outgoing edge throughputs ──
    if (outgoingEdges.length > 0) return outputBasedFactor(recipe, outgoingEdges, isRawFactor);

    // ── No edges and no slooping, so we assume a factor of 1 (or 0 for raw factor) ──
    return { inputFactor: !isRawFactor ? 1 : 0, outputFactor: !isRawFactor ? 1 : 0 }
}

/**Input based Factor **/
function inputBasedFactor(recipe: Recipe, incomingEdges: Edge<ItemEdgeData>[], isRawFactor = false): NodeFactor {
    const craftsPerMinute = 60 / recipe.duration;
    const byHandle = new Map<string, number>();
    for (const edge of incomingEdges) {
        const h = edge.targetHandle ?? "";
        byHandle.set(h, (byHandle.get(h) ?? 0) + (edge.data?.throughput ?? 0));
    }

    let lowestFactor = Infinity;
    byHandle.forEach((throughput, handleId) => {
        const idx = getItemIndexFromHandleId(handleId);
        const inputItem = recipe.input[idx];
        if (!inputItem) return;
        const required = inputItem.amount * craftsPerMinute;
        if (required > 0) lowestFactor = Math.min(lowestFactor, throughput / required);
    });

    if (!isFinite(lowestFactor)) lowestFactor = 0;

    return { inputFactor: lowestFactor, outputFactor: !isRawFactor ? lowestFactor : 0 };
}

/**Output based Factor **/
function outputBasedFactor(recipe: Recipe, outgoingEdges: Edge<ItemEdgeData>[], isRawFactor = false): NodeFactor {
    const craftsPerMinute = 60 / recipe.duration;
    const byHandle = new Map<string, number>();
    for (const edge of outgoingEdges) {
        const h = edge.sourceHandle ?? "";
        const idx = getItemIndexFromHandleId(h);
        const outputItem = recipe.output[idx];
        if (!outputItem) continue;
        const rateAtOne = outputItem.amount * craftsPerMinute;
        const factor = rateAtOne > 0 ? (edge.data?.throughput ?? 0) / rateAtOne : 0;
        byHandle.set(h, (byHandle.get(h) ?? 0) + factor);
    }

    const sorted = [...byHandle.values()].sort((a, b) => a - b);
    const lowestFactor = sorted[0] ?? 1;

    return {inputFactor: !isRawFactor ? lowestFactor : 0, outputFactor: lowestFactor};
}


/** Total throughput consumed from `handleId` across `edges`. */
export function totalThroughputForHandle(
    edges: Edge<ItemEdgeData>[],
    handleId: string,
    direction: "source" | "target",
): number {
    return edges
        .filter(e => (direction === "source" ? e.sourceHandle : e.targetHandle) === handleId)
        .reduce((sum, e) => sum + (e.data?.throughput ?? 0), 0);
}