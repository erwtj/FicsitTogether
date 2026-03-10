import { memo, useMemo } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getRecipe, getBuilding, getItem } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { useYjsMutation } from "../hooks/useYjsMutation";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import { type RecipeNodeType, type NodeFactor } from "../types";

import "./RecipeNode.css";

const DEFAULT_FACTOR: NodeFactor = { inputFactor: 1, outputFactor: 1 };

export const RecipeNode = memo(function RecipeNode({
    id,
    data,
}: NodeProps<RecipeNodeType>) {
    const { recipeClassName, sloopData } = data;
    useYjsMutation();

    const recipe = getRecipe(recipeClassName)!;
    const producedIn = getBuilding(recipe.producedIn)!;

    const isSlooped = sloopData && sloopData.length > 0;
    // Read pre-computed factor from data (pushed by useFactorySync) no edge store subscription
    const factor: NodeFactor = data._factor ?? DEFAULT_FACTOR;

    const outputOverUsed: Record<string, boolean> = data._outputOverUsed ?? {};
    const inputTooLow: Record<string, boolean> = data._inputTooLow ?? {};

    const craftsPerMinute = 60.0 / recipe.duration;

    const inputHandles = useMemo(() => recipe.input.map((input, i) => {
        const item = getItem(input.name)!;
        const handleId = `${id}-input-handle-${i}`;
        const solid = isItemSolid(item);

        return {
            id: handleId,
            position: `${(100 / (recipe.input.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(input.amount * craftsPerMinute * factor.inputFactor / (solid ? 1 : 1000)),
            item,
            inputToLow: inputTooLow[handleId] ?? false,
        };
    }), [recipe, id, craftsPerMinute, factor.inputFactor, inputTooLow]);

    const outputHandles = useMemo(() => recipe.output.map((output, i) => {
        const item = getItem(output.name)!;
        const handleId = `${id}-output-handle-${i}`;
        const solid = isItemSolid(item);
        return {
            id: handleId,
            position: `${(100 / (recipe.output.length + 1)) * (i + 1)}%`,
            displayAmount: roundTo3Decimals(output.amount * craftsPerMinute * factor.outputFactor / (solid ? 1 : 1000)),
            overUsed: outputOverUsed[handleId] ?? false,
            item,
        };
    }), [recipe, id, craftsPerMinute, factor.outputFactor, outputOverUsed]);

    const openSloopModal = () => {
        window.dispatchEvent(new CustomEvent("openSloopModal", {
            detail: { nodeId: id },
        }));
    };

    return (
        <div className="react-flow__node-default p-0">
            {inputHandles.map(h => (
                <ItemHandle key={h.id} item={h.item} id={h.id} type="target"
                            position={Position.Top} style={{ left: h.position }} />
            ))}

            <Card className={isSlooped ? "slooping" : ""}>
                <Card.Header style={{ height: "30px" }}>
                    {inputHandles.map(h => (
                        <span key={h.id} className="position-absolute"
                              style={{ width: "100px",
                                  left: `calc(${h.position} - 50px)`,
                                  color: h.inputToLow ? "#ff5a5a" : "white"
                        }}
                        >
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
                            <img className={isSlooped ? "sloop-image sloop-active" : "sloop-image"}
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