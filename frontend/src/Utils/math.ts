import { type Item } from "ficlib";

export function isItemSolid(item: Item) {
    return item.form === "RF_SOLID";
}

export function roundIfNecessary(number: number) {
    if (Math.round(number * 1000)/1000 !== Math.round(number )) {
        return Math.round(number * 1000) / 1000;
    }
    return Math.round(number);
}

export function throughputToDisplay(item: Item, throughput: number){
    if (isItemSolid(item)) {
        return roundIfNecessary(throughput).toString();
    } else {
        return `${roundIfNecessary(throughput / 1000)} m³`;
    }
}