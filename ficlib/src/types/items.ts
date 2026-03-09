import rawItems from "./items.json" with { type: "json" };

export type Item = {
    className: string;
    displayName: string;
    icon: string;
    form: string;
    energyValue: number;
    fluidColor: string;
    resourceSinkPoints: number;
};

const items = rawItems as readonly Item[];

// Module-level singleton
const itemsByClassName: ReadonlyMap<string, Item> = new Map(
    items.map(item => [item.className, item])
);

// Make map immutable
for (const item of itemsByClassName.values()) {
    Object.freeze(item);
}
Object.freeze(items);

export function getItem(className: string): Item | undefined {
    return itemsByClassName.get(className);
}

export function hasItem(className: string): boolean {
    return itemsByClassName.has(className);
}

export function getAllItems(): readonly Item[] {
    return items;
}