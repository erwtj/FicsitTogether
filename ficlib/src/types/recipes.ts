import rawRecipes from "./recipes.json" with { type: "json" };

export type Recipe = {
    className: string;
    displayName: string;
    output: {
        name: string; // Item.className
        amount: number;
    }[];
    input: {
        name: string; // Item.className
        amount: number;
    }[];
    duration: number;
    producedIn: string; // Building.className
};

const recipes = rawRecipes as readonly Recipe[];

// Module-level singleton
const recipesByClassName: ReadonlyMap<string, Recipe> = new Map(
    recipes.map(recipe => [recipe.className, recipe])
);

// Make map immutable
for (const recipe of recipesByClassName.values()) {
    Object.freeze(recipe);
}
Object.freeze(recipes);

export function getRecipe(className: string): Recipe | undefined {
    return recipesByClassName.get(className);
}

export function hasRecipe(className: string): boolean {
    return recipesByClassName.has(className);
}

export function getAllRecipes(): readonly Recipe[] {
    return recipes;
}