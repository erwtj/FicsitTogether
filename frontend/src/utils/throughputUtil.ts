import { type Item, getItem } from "ficlib";

export function isItemSolid(item: Item) {
    return item.form === "RF_SOLID";
}

export function isClassSolid(className: string) {
    const item = getItem(className);
    
    if (!item)
        throw new Error("Could not find class");
    
    return isItemSolid(item);
}

export function roundIfNecessary(number: number) {
    if (Math.round(number * 1000)/1000 !== Math.round(number )) {
        return Math.round(number * 1000) / 1000;
    }
    return Math.round(number);
}

export function throughputToDisplay(className: string, throughput: number){
    if (isClassSolid(className)) {
        return roundIfNecessary(throughput).toString();
    } else {
        return `${roundIfNecessary(throughput / 1000)} m³`;
    }
}