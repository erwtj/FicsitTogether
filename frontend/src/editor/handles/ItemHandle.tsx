import { Handle, type HandleProps, Position } from '@xyflow/react';
import { type Item } from "ficlib";
import React from "react";

export type ItemHandleData = {
    item: Item;
    id: string;
    position: Position;
    type: "source" | "target";
    inputTooLow?: boolean;
} & HandleProps & React.HTMLAttributes<HTMLDivElement>;

export function ItemHandle({ item, id, position, type, inputTooLow, ...rest }: ItemHandleData) {
    return(
        <Handle
            type={type}
            position={position}
            id={id}
            item-class={item.className}
            {...rest}
        >
            <div className="handleWrapper">
                <img
                    src={`/media/${item.icon}_256.webp`}
                    alt={item.displayName}
                    className="handleIcon"
                    draggable="false"
                />

                {inputTooLow && <div className="handleOverlay radar"/>}
            </div>
        </Handle>
    );
}