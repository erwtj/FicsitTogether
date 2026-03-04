import type { ChartDataDTO, EdgeDTO, ItemSpawnerNodeData, NodeDTO, outputNodeData } from "dtolib";
import { getItem } from "ficlib";

const TICKET_ID = "Desc_ResourceSinkCoupon_C"

export type ItemUsageData = { input: number; output: number };

function pickMap(
    itemClassName: string,
    allResources: Set<string>,
    resources: Map<string, ItemUsageData>,
    itemsMap: Map<string, ItemUsageData>,
): Map<string, ItemUsageData> {
    return allResources.has(itemClassName) ? resources : itemsMap;
}

function addToMap(
    map: Map<string, ItemUsageData>,
    key: string,
    delta: Partial<ItemUsageData>,
): void {
    const existing = map.get(key) ?? { input: 0, output: 0 };
    existing.input += delta.input ?? 0;
    existing.output += delta.output ?? 0;
    map.set(key, existing);
}

export function buildUsageMaps(
    charts: ChartDataDTO[],
    allResources: Set<string>,
): { resourceMap: Map<string, ItemUsageData>; itemMap: Map<string, ItemUsageData> } {
    const resourceMap = new Map<string, ItemUsageData>();
    const itemMap = new Map<string, ItemUsageData>();
    for (const chart of charts as ChartDataDTO[]) {

        // Build a map of output node ids to their total throughput
        const outputNodes = new Map<string, number>();
        for (const node of chart.nodes) {
            if (node.type === "end-node") {
                outputNodes.set(node.id, 0);
            }
        }
        for (const edge of chart.edges as EdgeDTO[]) {
            const targetNodeId = edge.target;
            if (outputNodes.has(targetNodeId)) {
                outputNodes.set(targetNodeId, (outputNodes.get(targetNodeId) ?? 0) + edge.data.throughput);
            }
        }

        for (const node of chart.nodes as NodeDTO[]) {
            if (node.type === "item-spawner-node") {
                const data = node.data as ItemSpawnerNodeData;
                const map = pickMap(data.itemClassName, allResources, resourceMap, itemMap);
                addToMap(map, data.itemClassName, { input: data.outputAmount });
            }
            else if (node.type === "end-node") {
                const data = node.data as outputNodeData;
                const className = data.itemClassName

                if (!data.sinkOutput) {
                    const map = pickMap(className, allResources, resourceMap, itemMap);
                    addToMap(map, className, { output: outputNodes.get(node.id) ?? 0 });
                } else {
                    const item = getItem(className);
                    if (!item) continue;

                    const ticketPoint = outputNodes.get(node.id)! * item.resourceSinkPoints

                    addToMap(itemMap, TICKET_ID, { output: ticketPoint ?? 0 });
                }
            }
        }
    }

    return { resourceMap, itemMap };
}