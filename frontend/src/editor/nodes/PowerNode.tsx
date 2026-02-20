import { memo } from "react";
import { type NodeProps, Position, useEdges } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getRecipe, getItem, getBuilding } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { roundTo3Decimals, isItemSolid  } from "../../utils/throughputUtil.ts";
import { getItemIndexFromHandleId } from "../utils/idUtils.ts";
import {type PowerNodeType, type ItemEdgeType} from "../types";

export const PowerNode = memo(function PowerNode({ id, data }: NodeProps<PowerNodeType>) {
    const { recipeClassName } = data;

    const recipe = getRecipe(recipeClassName)!;

    const allEdges = useEdges<ItemEdgeType>();
    const incomingEdges = allEdges.filter(e => e.target === id);

    // Group throughput by target handle, then find the most-constrained input
    const craftsPerMinute = 60 / recipe.duration;

    const throughputByHandle = new Map<string, number>();
    for (const edge of incomingEdges) {
        const h = edge.targetHandle ?? "";
        throughputByHandle.set(h, (throughputByHandle.get(h) ?? 0) + (edge.data?.throughput ?? 0));
    }

    let lowestFactor = 1;
    if (throughputByHandle.size > 0) {
        lowestFactor = Infinity;
        throughputByHandle.forEach((throughput, handleId) => {
            const idx = getItemIndexFromHandleId(handleId);
            const input = recipe.input[idx];
            if (!input) return;
            const required = input.amount * craftsPerMinute;
            if (required > 0) lowestFactor = Math.min(lowestFactor, throughput / required);
        });
        if (!isFinite(lowestFactor)) lowestFactor = 1;
    }

    const inputHandles = recipe.input.map((input, i) => {
        const handleId = `${id}-input-handle-${i}`;
        const item = getItem(input.name)!;
        const solid = isItemSolid(item);
        return {
            id: handleId,
            position: `${(100 / (recipe.input.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(input.amount * craftsPerMinute * lowestFactor / (solid ? 1 : 1000)),
            item: item,
        };
    });
    
    const building = getBuilding(recipe.producedIn)!;

    return (
        <div className="react-flow__node-default p-0">
            {inputHandles.map(h => (
                <ItemHandle key={h.id} item={h.item} id={h.id} type="target"
                            position={Position.Top} style={{ left: h.position }} />
            ))}

            <Card>
                <Card.Header style={{ height: "30px" }}>
                    {inputHandles.map(h => (
                        <span key={h.id} className="position-absolute"
                              style={{ width: "100px", left: `calc(${h.position} - 50px)` }}>
                            {h.displayAmount}
                        </span>
                    ))}
                </Card.Header>

                <Card.Body className="p-3">
                    <div className="container">
                        <div className="row gap-2">
                            <div className="col-auto p-0 align-content-center">
                                <img src={`/media/${building.icon}_256.webp`}
                                     alt={building.displayName} className="buildingIcon" />
                            </div>
                            <div className="col-auto p-1 text-start">
                                <h5 className="fs-6">{recipe.displayName}</h5>
                                <div className="d-flex flex-row gap-3 text-muted">
                                    <span>{building.displayName} x{roundTo3Decimals(lowestFactor)}</span>
                                    <span className="text-success">
                                        {roundTo3Decimals(building.powerProduction * lowestFactor)} MW
                                    </span>
                                </div>
                            </div>
                            <div className="col-auto p-0 align-content-center">
                                <img src={`/media/${inputHandles[0].item.icon}_256.webp`}
                                     alt={inputHandles[0].item.displayName} className="itemIcon" />
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
});