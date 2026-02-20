import { memo } from "react";
import { type NodeProps, Position, useEdges } from "@xyflow/react";
import { Card } from "react-bootstrap";
import { getItem } from "ficlib";
import { ItemHandle } from "../handles/ItemHandle";
import { roundTo3Decimals, isItemSolid } from "../../utils/throughputUtil.ts";
import {type EndNodeType, type ItemEdgeType} from "../types";

export const EndNode = memo(function EndNode({ id, data }: NodeProps<EndNodeType>) {
    const { itemClassName } = data;

    const item = itemClassName ? getItem(itemClassName) : undefined;
    const solid = item ? isItemSolid(item) : true;

    const allEdges = useEdges<ItemEdgeType>();
    const incomingEdges = allEdges.filter(e => e.target === id);
    const totalThroughput = incomingEdges.reduce((s, e) => s + (e.data?.throughput ?? 0), 0);
    const displayAmount = roundTo3Decimals(totalThroughput / (solid ? 1 : 1000));

    const handleId = `${id}-input-handle-0`;
    
    if (!item)
        return null;

    return (
        <div className="react-flow__node-default p-0">
            <ItemHandle item={item} id={handleId} type="target"
                        position={Position.Top} style={{ left: "50%" }} />

            <Card>
                <Card.Header style={{ height: "30px" }}>
                    <span className="position-absolute"
                          style={{ width: "100px", left: "calc(50% - 50px)" }}>
                        {displayAmount}
                    </span>
                </Card.Header>
                <Card.Body className="p-3 text-center">
                    {item && (
                        <img src={`/media/${item.icon}_256.webp`} alt={item.displayName}
                             className="itemIcon mb-1" />
                    )}
                    <div className="fw-semibold">{item.displayName}</div>
                    <div className="text-muted">{displayAmount} /min</div>
                </Card.Body>
                
                <Card.Footer style={{ height: "30px" }}>
                    TODO: Convert to sink points
                </Card.Footer>
            </Card>
        </div>
    );
});