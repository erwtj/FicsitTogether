import rawCategories from "./categories.json" with { type: "json" };
import {getAllItems, getItem, Item} from "./items.js";

export type Category = {
    category: string;
    items: string[]; // string[] of Item.className
}

const categories = rawCategories as readonly Category[];

// Module-level singleton
const categoriesByClassName: ReadonlyMap<string, Category> = new Map(
    categories.map(category => [category.category, category])
);

// Make map immutable
for (const category of categoriesByClassName.values()) {
    Object.freeze(category);
}
Object.freeze(categories);

export function getCategory(category: string): Category | undefined {
    return categoriesByClassName.get(category);
}

export function getCategoryItems(category: string): Item[] {
    let cat = getCategory(category);
    if (!cat)
        return [];
    
    return cat.items.map(item => getItem(item)) as Item[];
}

export function hasCategory(category: string): boolean {
    return categoriesByClassName.has(category);
}

export function getAllCategories(): readonly Category[] {
    return categories;
}