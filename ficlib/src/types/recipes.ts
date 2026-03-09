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

// Create maps for recipes by output and input items
const recipeByOutputItem: ReadonlyMap<string, Recipe[]> = (() => {
    const map = new Map<string, Recipe[]>();
    for (const recipe of recipes) {
        for (const output of recipe.output) {
            const existing = map.get(output.name) || [];
            map.set(output.name, [...existing, recipe]);
        }
    }
    return map;
})();

const recipeByInputItem: ReadonlyMap<string, Recipe[]> = (() => {
    const map = new Map<string, Recipe[]>();
    for (const recipe of recipes) {
        for (const input of recipe.input) {
            const existing = map.get(input.name) || [];
            map.set(input.name, [...existing, recipe]);
        }
    }
    return map;
})();

// Make maps immutable
for (const recipe of recipesByClassName.values()) {
    Object.freeze(recipe);
}
Object.freeze(recipes);

for (const recipes of recipeByOutputItem.values()) {
    Object.freeze(recipes);
}
Object.freeze(recipeByOutputItem);

for (const recipes of recipeByInputItem.values()) {
    Object.freeze(recipes);
}
Object.freeze(recipeByInputItem);


export function getRecipesByOutputItem(itemClassName: string): readonly Recipe[] {
    return recipeByOutputItem.get(itemClassName) || [];
}

export function getRecipesByInputItem(itemClassName: string): readonly Recipe[] {
    return recipeByInputItem.get(itemClassName) || [];
}

export function getRecipe(className: string): Recipe | undefined {
    return recipesByClassName.get(className);
}

export function hasRecipe(className: string): boolean {
    return recipesByClassName.has(className);
}

export function getAllRecipes(): readonly Recipe[] {
    return recipes;
}