import { useMemo } from "react";
import { type Node } from "@xyflow/react";
import { getBuilding, getItem, getRecipe } from "ficlib";
import {
    type ItemSpawnerNodeData,
    type EndNodeData,
    type RecipeNodeData,
    type PowerNodeData,
} from "../types";
import { roundTo3Decimals } from "../../utils/throughputUtil";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ItemThroughput = {
    className: string;
    displayName: string;
    icon: string;
    /** Items (or mL for fluids) per minute */
    amountPerMin: number;
};

export type BuildingCount = {
    className: string;
    displayName: string;
    icon: string;
    count: number;
};

export type FactoryStats = {
    /** Raw inputs from ItemSpawner nodes, grouped by item */
    inputs: ItemThroughput[];
    /** Raw outputs from End nodes, grouped by item */
    outputs: ItemThroughput[];
    powerConsumptionMW: number;
    powerProductionMW: number;
    buildings: BuildingCount[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function accumulateItem(
    map: Map<string, number>,
    className: string,
    amount: number,
) {
    map.set(className, (map.get(className) ?? 0) + amount);
}

function mapToItemThroughputs(map: Map<string, number>): ItemThroughput[] {
    return Array.from(map.entries())
        .filter(([, amount]) => amount > 0)
        .map(([className, amountPerMin]) => {
            const item = getItem(className);
            return {
                className,
                displayName: item?.displayName ?? className,
                icon: item?.icon ?? "",
                amountPerMin,
            };
        });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Derives factory-wide stats from the current node state.
 * All computed values (_factor, _totalThroughput, etc.) are pushed into node
 * data by useFactorySync, so this hook just reads them — no expensive
 * recalculations, no edge subscriptions.
 */
export function useFactoryStats(nodes: Node[]): FactoryStats {
    return useMemo(() => {
        const inputMap = new Map<string, number>();
        const outputMap = new Map<string, number>();
        const buildingMap = new Map<string, number>();
        let powerConsumptionMW = 0;
        let powerProductionMW = 0;

        for (const node of nodes) {
            if (node.type === "item-spawner-node") {
                const d = node.data as ItemSpawnerNodeData;
                accumulateItem(inputMap, d.itemClassName, d.outputAmount);
                continue;
            }

            if (node.type === "end-node") {
                const d = node.data as EndNodeData;
                if (!d.itemClassName) continue;
                const total = d._totalThroughput ?? 0;
                const totalSinkPoints = d._totalSinkPoints ?? 0;
                if (d.sinkOutput)
                    accumulateItem(outputMap, 'Desc_ResourceSinkCoupon_C', totalSinkPoints);
                else
                    accumulateItem(outputMap, d.itemClassName, total);
                continue;
            }

            if (node.type === "recipe-node") {
                const d = node.data as RecipeNodeData;
                const recipe = getRecipe(d.recipeClassName);
                if (!recipe) continue;

                const factor = d._factor?.inputFactor ?? 1;
                const building = getBuilding(recipe.producedIn);
                if (building) {
                    powerConsumptionMW += building.powerConsumption * factor;
                    if (building.powerProduction > 0)
                        powerProductionMW += building.powerProduction * factor;
                    buildingMap.set(
                        recipe.producedIn,
                        (buildingMap.get(recipe.producedIn) ?? 0) + factor,
                    );
                }
                continue;
            }

            if (node.type === "power-node") {
                const d = node.data as PowerNodeData;
                const recipe = getRecipe(d.recipeClassName);
                if (!recipe) continue;

                const factor = d._factor ?? 1;
                const building = getBuilding(recipe.producedIn);
                if (building) {
                    powerProductionMW += building.powerProduction * factor;
                    buildingMap.set(
                        recipe.producedIn,
                        (buildingMap.get(recipe.producedIn) ?? 0) + factor,
                    );
                }
            }
        }

        const buildings: BuildingCount[] = Array.from(buildingMap.entries()).map(
            ([className, count]) => {
                const building = getBuilding(className);
                return {
                    className,
                    displayName: building?.displayName ?? className,
                    icon: building?.icon ?? "",
                    count: roundTo3Decimals(count),
                };
            },
        );

        return {
            inputs: mapToItemThroughputs(inputMap),
            outputs: mapToItemThroughputs(outputMap),
            powerConsumptionMW: roundTo3Decimals(powerConsumptionMW),
            powerProductionMW: roundTo3Decimals(powerProductionMW),
            buildings,
        };
    }, [nodes]);
}

