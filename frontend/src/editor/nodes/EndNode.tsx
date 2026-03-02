import { memo, useCallback } from "react";
import { type NodeProps, Position } from "@xyflow/react";
import { Card, Form } from "react-bootstrap";
import { getItem } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import { type EndNodeType } from "../types";
import {useYjsMutation} from "../hooks/useYjsMutation.ts";

const ticketIcon = getItem("Desc_ResourceSinkCoupon_C")!.icon;

export const EndNode = memo(function EndNode({ id, data }: NodeProps<EndNodeType>) {
    const { itemClassName, sinkOutput } = data;
    const { updateNodeData } = useYjsMutation();

    const item = itemClassName ? getItem(itemClassName) : undefined;
    const solid = item ? isItemSolid(item) : true;

    // Read pre-computed total throughput from data (pushed by useFactorySync)
    const totalThroughput = data._totalThroughput ?? 0;
    const displayAmount = roundTo3Decimals(totalThroughput / (solid ? 1 : 1000));
    const displayTickets = roundTo3Decimals(data._totalSinkPoints ?? 0);

    const handleId = `${id}-input-handle-0`;

    const toggleConvertTickets = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { sinkOutput: e.target.checked });
    }, [id, updateNodeData]);

    if (!item)
        return null;

    return (
        <div className={"react-flow__node-default p-0"}>
            <ItemHandle item={item} id={handleId} type={"target"}
                        position={Position.Top} style={{ left: "50%" }}/>

            <Card>
                <Card.Header style={{height: "30px"}}>
                            <span className={"text-center"}>
                                {displayAmount}
                            </span>
                </Card.Header>

                <Card.Body className="p-3 pt-2">
                    <div className="container">
                        <div className="row gap-2">
                            <div className="col-auto p-1 text-start">
                                <h5 className="fs-6">
                                    {item.displayName}
                                </h5>
                                <span className={"text-body num-input"}>
                                    {sinkOutput ? displayTickets : displayAmount} {!solid && " m³"}
                                </span>
                            </div>

                            <div className="col-auto p-0 align-content-center">
                                <img src={`/media/${sinkOutput ? ticketIcon : item.icon}_256.webp`}
                                     alt={item.displayName}
                                     className="itemIcon"></img>
                            </div>
                        </div>
                    </div>
                </Card.Body>
                    {(isItemSolid(item) && item.resourceSinkPoints !== 0) &&
                        <Card.Footer style={{height: "35px"}}>
                            <Form.Switch
                                id={"switch" + id}
                                label="Convert to sink points"
                                checked={sinkOutput}
                                onChange={toggleConvertTickets}
                            />
                        </Card.Footer>
                    }
            </Card>
        </div>
    );
});