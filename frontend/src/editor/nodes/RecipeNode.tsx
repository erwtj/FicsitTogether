import { memo } from "react";
import { type NodeProps, Position, useEdges } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getRecipe, getBuilding, getItem } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { computeNodeFactor, totalThroughputForHandle } from "../utils/factoryCalc";
import { useYjsMutation } from "../hooks/useYjsMutation";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import {type RecipeNodeType, type ItemEdgeType} from "../types";

import "./RecipeNode.css";

export const RecipeNode = memo(function RecipeNode({
                                                       id,
                                                       data,
                                                   }: NodeProps<RecipeNodeType>) {
    const { recipeClassName, summerSloops, percentage } = data;
    /*const { updateNodeData } =*/ useYjsMutation();

    const recipe = getRecipe(recipeClassName)!;
    const producedIn = getBuilding(recipe.producedIn)!;

    const allEdges = useEdges<ItemEdgeType>();
    const incomingEdges = allEdges.filter(e => e.target === id);
    const outgoingEdges = allEdges.filter(e => e.source === id);

    const factor = computeNodeFactor(recipe, summerSloops, percentage, incomingEdges, outgoingEdges);
    const craftsPerMinute = 60.0 / recipe.duration;

    const inputHandles = recipe.input.map((input, i) => {
        const item = getItem(input.name)!;
        
        const handleId = `${id}-input-handle-${i}`;
        const solid = isItemSolid(item);
        return {
            id: handleId,
            position: `${(100 / (recipe.input.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(input.amount * craftsPerMinute * factor.inputFactor / (solid ? 1 : 1000)),
            item: item,
        };
    });

    const outputHandles = recipe.output.map((output, i) => {
        const item = getItem(output.name)!;
        
        const handleId = `${id}-output-handle-${i}`;
        const solid = isItemSolid(item);
        const maxAmount = output.amount * craftsPerMinute * factor.outputFactor / (solid ? 1 : 1000);
        const usedAmount = totalThroughputForHandle(outgoingEdges, handleId, "source") / (solid ? 1 : 1000);
        return {
            id: handleId,
            position: `${(100 / (recipe.output.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(maxAmount),
            overUsed: roundTo3Decimals(usedAmount) > roundTo3Decimals(maxAmount),
            item: item,
        };
    });

    const openSloopModal = () => {
        window.dispatchEvent(new CustomEvent("openSloopModal", {
            detail: { nodeId: id, summerSloops, percentage },
        }));
    };

    return (
        <div className="react-flow__node-default p-0">
            {inputHandles.map(h => (
                <ItemHandle key={h.id} item={h.item} id={h.id} type="target"
                            position={Position.Top} style={{ left: h.position }} />
            ))}

            <Card className={summerSloops !== 0 ? "slooping" : ""}>
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
                                <img src={`/media/${producedIn.icon}_256.webp`}
                                     alt={producedIn.displayName} className="buildingIcon" />
                            </div>
                            <div className="col-auto p-1 text-start">
                                <h5 className="fs-6">{recipe.displayName}</h5>
                                <div className="d-flex flex-row gap-3 text-muted">
                                    <span>{producedIn.displayName} x{roundTo3Decimals(factor.inputFactor)}</span>
                                    {producedIn.powerConsumption !== 0
                                        ? <span>{roundTo3Decimals(producedIn.powerConsumption * factor.inputFactor)} MW</span>
                                        : <span className="text-success">{roundTo3Decimals(producedIn.powerProduction * factor.inputFactor)} MW</span>
                                    }
                                </div>
                            </div>
                            <div className="col-auto p-0 align-content-center">
                                <img src={`/media/${outputHandles[0].item.icon}_256.webp`}
                                     alt={outputHandles[0].item.displayName} className="itemIcon" />
                            </div>
                        </div>
                    </div>
                </Card.Body>

                <Card.Footer style={{ height: "30px" }} className="p-0">
                    {outputHandles.map(h => (
                        <span key={h.id} className="position-absolute"
                              style={{ width: "100px", left: `calc(${h.position} - 50px)`, color: h.overUsed ? "#ff5a5a" : undefined }}>
                            {h.displayAmount}
                        </span>
                    ))}
                    {producedIn.somersloopsNeeded > 0 && (
                        <button className="sloopButton" onClick={openSloopModal}>
                            <img className={summerSloops === 0 ? "sloop-image" : "sloop-image sloop-active"}
                                 src="/media/FactoryGame/Prototype/WAT/UI/Wat_1_256.webp" alt="sloop" />
                        </button>
                    )}
                </Card.Footer>
            </Card>

            {outputHandles.map(h => (
                <ItemHandle key={h.id} item={h.item} id={h.id} type="source"
                            position={Position.Bottom} style={{ left: h.position }} />
            ))}
        </div>
    );
});