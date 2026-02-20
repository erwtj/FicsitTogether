import { type Edge } from "@xyflow/react";
import { type Recipe, getBuilding } from "ficlib";
import { type NodeFactor, type ItemEdgeData } from "../types";
import {getItemIndexFromHandleId} from "./idUtils.ts";

// ─── Somer Sloop helpers ─────────────────────────────────────────────────────

/**
 * Factor when the bottleneck is determined by incoming belts (input-driven).
 * inputFactor stays as-is; sloops boost the outputFactor.
 */
function sloopInputBased(
    inputFactor: number,
    somersloops: number,
    percentage: number[],
): NodeFactor {
    let sloopBonus = 0;
    percentage.forEach((pct, i) => {
        const slots = Math.max(0, Math.min(2, somersloops - 2 * i));
        sloopBonus += (slots / 2) * (pct / 100);
    });
    return { inputFactor, outputFactor: inputFactor + sloopBonus };
}

/**
 * Factor when driven by outgoing belt demand (output-driven).
 */
function sloopOutputBased(
    factor: number,
    somersloops: number,
    percentage: number[],
    buildingSloopCount: number,
): NodeFactor {
    const baseClockFactor = percentage.reduce((a, v) => a + v, 0) / 100;
    let sloopBonus = 0;
    percentage.forEach((pct, i) => {
        const slots = Math.max(0, Math.min(buildingSloopCount, somersloops - buildingSloopCount * i));
        sloopBonus += (slots / buildingSloopCount) * (pct / 100);
    });
    if (factor > baseClockFactor + sloopBonus) {
        return { inputFactor: factor - sloopBonus, outputFactor: factor };
    }
    return { inputFactor: baseClockFactor, outputFactor: baseClockFactor + sloopBonus };
}

/**
 * Factor when there are no connected edges at all.
 */
function sloopEmptyBased(
    somersloops: number,
    percentage: number[],
    buildingSloopCount: number,
): NodeFactor {
    const baseClockFactor = percentage.reduce((a, v) => a + v, 0) / 100;
    let sloopBonus = 0;
    percentage.forEach((pct, i) => {
        const slots = Math.max(0, Math.min(buildingSloopCount, somersloops - buildingSloopCount * i));
        sloopBonus += (slots / buildingSloopCount) * (pct / 100);
    });
    return { inputFactor: baseClockFactor, outputFactor: baseClockFactor + sloopBonus };
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
    somersloops: number,
    percentage: number[],
    incomingEdges: Edge<ItemEdgeData>[],
    outgoingEdges: Edge<ItemEdgeData>[],
): NodeFactor {
    const craftsPerMinute = 60.0 / recipe.duration;
    const building = getBuilding(recipe.producedIn);
    const buildingSloopCount: number = building?.somersloopsNeeded ?? 2;

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

        return somersloops !== 0
            ? sloopInputBased(lowestFactor, somersloops, percentage)
            : { inputFactor: lowestFactor, outputFactor: lowestFactor };
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

        return somersloops !== 0
            ? sloopOutputBased(lowestFactor, somersloops, percentage, buildingSloopCount)
            : { inputFactor: lowestFactor, outputFactor: lowestFactor };
    }

    // ── No edges ──
    return somersloops !== 0
        ? sloopEmptyBased(somersloops, percentage, buildingSloopCount)
        : { inputFactor: 1, outputFactor: 1 };
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