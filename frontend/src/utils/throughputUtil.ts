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

export function roundTo4Decimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function roundTo3Decimals(value: number): number {
    return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export function cleanThroughputToDisplay(className: string, throughput: number): number {
    if (isClassSolid(className)) {
        return roundTo3Decimals(throughput);
    } else {
        return roundTo3Decimals(throughput / 1000);
    }
}

export function throughputToDisplay(className: string, throughput: number){
    if (isClassSolid(className)) {
        return roundTo3Decimals(throughput).toString();
    } else {
        return `${roundTo3Decimals(throughput / 1000)} m³`;
    }
}