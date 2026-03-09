import { Handle, type HandleProps, Position } from '@xyflow/react';
import { type Item } from "ficlib";
import React from "react";
import {useClientSettings} from "../../hooks/useClientSettings.ts";
import {OverlayTrigger, Tooltip } from "react-bootstrap";

export type ItemHandleData = {
    item: Item;
    id: string;
    position: Position;
    type: "source" | "target";
} & HandleProps & React.HTMLAttributes<HTMLDivElement>;

export function ItemHandle({ item, id, position, type, ...rest }: ItemHandleData) {

    const { clientSettings } = useClientSettings()

    const handleComponent = (
        <Handle
            type={type}
            position={position}
            id={id}
            item-class={item.className}
            {...rest}
        >
            <img src={`/media/${item.icon}_256.webp`} alt={item.displayName} className="handleIcon" draggable="false" />
        </Handle>
    );

    return clientSettings.showToolTips ? (
        <OverlayTrigger
            placement={type === "source" ? "bottom" : "top"}
            overlay={<Tooltip id={`tooltip-${id}`} className={"item-tooltip"}>{item.displayName}</Tooltip>}
        >
            {handleComponent}
        </OverlayTrigger>
    ) : (
        handleComponent
    );
}