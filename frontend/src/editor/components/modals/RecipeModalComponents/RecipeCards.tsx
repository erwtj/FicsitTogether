// RecipeCards.tsx
import {throughputToDisplay} from "../../../../utils/throughputUtil.ts";
import {getItem, getBuilding, type Item, type Recipe} from "ficlib";
import {LightningFill} from "react-bootstrap-icons";

const SpawnRecipeCard = ({ item, onSelect }: { item: Item, onSelect: () => void }) => (
    <div onClick={onSelect} className="recipeCard p-2 fs-8">
        <div className="d-flex flex-row gap-1 pe-2">
            <div className="left-col text-center">
                <img alt={item.displayName} className="recipeBigIcon" src={`/media/${item.icon}_256.webp`} draggable={false}/>
            </div>
            <div className="flex-fill text-start pe-2">
                <h6 className="fs-7">Spawn {item.displayName}</h6>
                <span className="text-muted">Spawn output</span>
            </div>
        </div>
    </div>
);

const ItemThroughputDisplay = ({className, duration, amount}: {className: string, duration: number, amount: number}) => {
    const item = getItem(className);
    if (!item) {
        return null;
    }

    return (
        <div>
            <img alt={item.displayName} className="recipeTinyIcon"
                 src={`/media/${item.icon}_256.webp`} draggable={false}/>
            <span>{throughputToDisplay(className, 60 / duration * amount)}</span>
        </div>
    )
}

const RecipeCard = ({ recipe, selectedItem, onSelect }: { recipe: Recipe, selectedItem: string, onSelect: () => void }) => {
    const mainOutputEntry = recipe.output.find(o => o.name === selectedItem);
    const mainOutputItem = getItem(recipe.output[0]?.name);
    const secondaryOutputItem = getItem(recipe.output[1]?.name);
    if (!mainOutputEntry || !mainOutputItem) return null;

    const buildingDisplayName = getBuilding(recipe.producedIn)?.displayName || recipe.producedIn;

    return (
        <div onClick={onSelect} className="recipeCard p-2 fs-8">
            <div className="d-flex flex-row gap-1 pe-2">
                <div className="left-col text-center">
                    <img alt={mainOutputItem.displayName} className="recipeBigIcon"
                         src={`/media/${mainOutputItem.icon}_256.webp`} draggable={false}/>
                    {secondaryOutputItem && (
                        <img alt={secondaryOutputItem.displayName} className="recipeSmallIcon"
                             src={`/media/${secondaryOutputItem.icon}_256.webp`} draggable={false}/>
                    )}
                </div>
                <div className="flex-fill text-start">
                    <h6 className="fs-7">{recipe.displayName}</h6>
                    <span className="text-muted">{buildingDisplayName}</span>
                </div>
            </div>
            <div className="d-flex flex-row gap-1 mt-2">
                <div className="text-center left-col">
                    <span>{throughputToDisplay(mainOutputEntry.name, 60 / recipe.duration * mainOutputEntry.amount)}{' / m'}</span>
                </div>
                <div className="d-flex flex-row flex-wrap gap-2">
                    {recipe.input.map(input =>
                        <ItemThroughputDisplay className={input.name} amount={input.amount} duration={recipe.duration} key={input.name} />
                    )}
                </div>
            </div>
        </div>
    );
};

const PowerRecipeCard = ({ recipe, item, onSelect }: { recipe: Recipe, item: Item, onSelect: () => void }) => {
    const building = getBuilding(recipe.producedIn)!;

    return (
    <div onClick={onSelect} className="recipeCard p-2 fs-8" style={{ minHeight: "80px" }}>
        <div className="d-flex flex-row gap-1 pe-2">
            <div className="left-col text-center">
                <img alt={item.displayName} className="recipeBigIcon" src={`/media/${item.icon}_256.webp`} draggable={false}/>
                <LightningFill className="recipeSmallIcon lightning" size={25}/>
            </div>
            <div className="flex-fill text-start">
                <h6 className="fs-7">{recipe.displayName}</h6>
                <span className="text-muted">{building.displayName}</span>
            </div>
        </div>
        <div className="d-flex flex-row gap-1 mt-2">
            <div className="text-center left-col"><span>{building?.powerProduction} MW</span></div>
            <div className="d-flex flex-row flex-wrap gap-2">
                {recipe.input.map(input =>
                    <ItemThroughputDisplay className={input.name} amount={input.amount} duration={recipe.duration} key={input.name} />
                )}
            </div>
        </div>
    </div>);
};

const CountRecipeCard = ({ item, onSelect }: { item: Item, onSelect: () => void }) => (
    <div onClick={onSelect} className="recipeCard p-2 fs-8" style={{ minHeight: "80px" }}>
        <div className="d-flex flex-row gap-1 pe-2">
            <div className="left-col text-center">
                <img alt={item.displayName} className="recipeBigIcon" src={`/media/${item.icon}_256.webp`} draggable={false}/>
            </div>
            <div className="flex-fill text-start pe-2">
                <h6 className="fs-7">Count {item.displayName}</h6>
                <span className="text-muted">Count input</span>
            </div>
        </div>
    </div>
);

export {PowerRecipeCard, CountRecipeCard, SpawnRecipeCard, RecipeCard};