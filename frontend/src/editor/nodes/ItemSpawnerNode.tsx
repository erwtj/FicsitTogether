import { memo, useState } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getItem } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { useYjsMutation } from "../hooks/useYjsMutation";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import { type ItemSpawnerNodeType } from "../types";

import "./ItemSpawnerNode.css";

export const ItemSpawnerNode = memo(function ItemSpawnerNode({
    id,
    data,
}: NodeProps<ItemSpawnerNodeType>) {
    const { itemClassName, outputAmount } = data;
    const { updateNodeAndSingleEdgeData } = useYjsMutation();

    const item = getItem(itemClassName)!;

    const solid = isItemSolid(item);
    const handleId = `${id}-output-handle-0`;
    const displayAmount = roundTo3Decimals(outputAmount / (solid ? 1 : 1000));

    const [inputValue, setInputValue] = useState<string>(String(displayAmount));
    const [isFocused, setIsFocused] = useState(false);

    const visibleValue = isFocused ? inputValue : String(displayAmount);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setInputValue(raw);

        const val = parseFloat(raw);
        if (!isNaN(val) && val >= 0)
            updateNodeAndSingleEdgeData(id, { outputAmount: solid ? val : val * 1000 });
        else if (raw === "")
            updateNodeAndSingleEdgeData(id, { outputAmount: 0 });
    };

    return (
        <div className="react-flow__node-default p-0">
            <Card>
                <Card.Body className="p-3 pb-2">
                    <div className="container">
                        <div className="row gap-2">
                            <div className="col-auto p-1 text-start">
                                <h5 className="fs-6">
                                    {item.displayName}
                                </h5>

                                <input
                                    type={"number"}
                                    inputMode={"decimal"}
                                    className={"form-control fs-8 num-input nodrag"}
                                    placeholder={"0"}
                                    value={visibleValue}
                                    onChange={onChange}
                                    onFocus={() => { setInputValue(displayAmount === 0 ? "" : String(displayAmount)); setIsFocused(true); }}
                                    onBlur={() => setIsFocused(false)}
                                    onClickCapture={e => e.stopPropagation()}
                                    onDoubleClickCapture={e => e.stopPropagation()}
                                />
                            </div>

                            <div className="col-auto p-0 align-content-center">
                                <img src={`/media/${item.icon}_256.webp`}
                                     alt={item.displayName}
                                     className="itemIcon">
                                </img>
                            </div>
                        </div>
                    </div>
                </Card.Body>

                <Card.Footer style={{height: "30px"}} className="p-0">
                    <span className="text-center">{displayAmount} {!isItemSolid(item) && " m³"}</span>
                </Card.Footer>
            </Card>

            <ItemHandle item={item} id={handleId} type="source" position={Position.Bottom} style={{ left: "50%" }} />
        </div>
    );
});