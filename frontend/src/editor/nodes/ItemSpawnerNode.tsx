import { memo } from "react";
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
    const { updateNodeData } = useYjsMutation();

    const item = getItem(itemClassName);
    if (!item) return <div className="react-flow__node-default p-2 text-danger">Unknown item: {itemClassName}</div>;

    const solid = isItemSolid(item);
    const handleId = `${id}-output-handle-0`;
    const displayAmount = roundTo3Decimals(outputAmount / (solid ? 1 : 1000));

    return (
        <div className="react-flow__node-default p-0">
            <Card>
                <Card.Body className="p-3">
                    <div className="d-flex flex-row align-items-center gap-2">
                        <img src={`/media/${item.icon}_256.webp`} alt={item.displayName} className="itemIcon" />
                        <div>
                            <div className="fw-semibold">{item.displayName}</div>
                            <input
                                type="number"
                                className="form-control form-control-sm num-input"
                                value={displayAmount}
                                onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0)
                                        updateNodeData(id, { outputAmount: solid ? val : val * 1000 });
                                }}
                                onClickCapture={e => e.stopPropagation()}
                                onDoubleClickCapture={e => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </Card.Body>
                <Card.Footer style={{ height: "30px" }} className="p-0">
                    <span className="position-absolute" style={{ width: "100px", left: "calc(50% - 50px)" }}>
                        {displayAmount}
                    </span>
                </Card.Footer>
            </Card>

            <ItemHandle item={item} id={handleId} type="source" position={Position.Bottom} style={{ left: "50%" }} />
        </div>
    );
});