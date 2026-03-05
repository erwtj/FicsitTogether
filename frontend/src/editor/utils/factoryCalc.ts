import { type Edge } from "@xyflow/react";
import { type Recipe, getBuilding } from "ficlib";
import {type NodeFactor, type ItemEdgeData, type SloopData} from "../types";
import {getItemIndexFromHandleId} from "./idUtils.ts";

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
): NodeFactor {
    const craftsPerMinute = 60 / recipe.duration;
    const building = getBuilding(recipe.producedIn)!;
    const buildingSloopCount = building.somersloopsNeeded;

    if (sloopData && sloopData.length > 0) {
        let totalInputFactor = 0
        let totalOutputFactor = 0

        for (let i = 0; i < sloopData.length; i++) {
            totalInputFactor += sloopData[i].overclockPercentage / 100;
            totalOutputFactor += 1 + (sloopData[i].sloopAmount / buildingSloopCount) * sloopData[i].overclockPercentage / 100;
        }

        return {
            inputFactor: totalInputFactor,
            outputFactor: totalOutputFactor,
        }
    }

    // ── Input-driven: group incoming throughput by target handle ──
    if (incomingEdges.length > 0) {
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

        return { inputFactor: lowestFactor, outputFactor: lowestFactor };
    }

    // ── Output-driven: infer factor from outgoing edge throughputs ──
    if (outgoingEdges.length > 0) {
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

        return { inputFactor: lowestFactor, outputFactor: lowestFactor };
    }
    return { inputFactor: 1, outputFactor: 1 }
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