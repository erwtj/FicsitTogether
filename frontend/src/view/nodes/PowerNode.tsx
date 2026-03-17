import { memo } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getRecipe, getItem, getBuilding } from "ficlib";
import { ItemHandle } from "../../editor/handles/ItemHandle";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import { type PowerNodeType } from "../../editor/types";

export const PowerNode = memo(function PowerNode({ id, data }: NodeProps<PowerNodeType>) {
    const { recipeClassName } = data;

    const recipe = getRecipe(recipeClassName)!;

    // Read pre-computed factor from data (pushed by useFactorySync)
    const lowestFactor = data._factor ?? 1;

    const craftsPerMinute = 60 / recipe.duration;

    const inputHandles = recipe.input.map((input, i) => {
        const handleId = `${id}-input-handle-${i}`;
        const item = getItem(input.name)!;
        const solid = isItemSolid(item);
        return {
            id: handleId,
            position: `${(100 / (recipe.input.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(input.amount * craftsPerMinute * lowestFactor / (solid ? 1 : 1000)),
            item,
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