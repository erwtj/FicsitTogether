import {useState, useMemo} from "react";
import {getItemCategories, getAllCategories, getRecipesByInputItem, getAllItems, getItem, getRecipesByOutputItem} from "ficlib"
import {Modal} from "react-bootstrap";
import "./RecipeModal.tsx.css";
import CategorySidebar from "./RecipeModalComponents/CategorySidebar.tsx";
import ItemGrid from "./RecipeModalComponents/ItemGrid.tsx";
import {CountRecipeCard, PowerRecipeCard, RecipeCard, SpawnRecipeCard} from "./RecipeModalComponents/RecipeCards.tsx";

export type RecipeModalProps = {
    show: boolean;
    onModalSubmit: (type: 'none' | 'recipe' | 'item-spawner' | 'item-end' | 'power',
                    value: string | null) => void;
    RequiredInput: string | null;
    RequiredOutput: string | null;
}

function getRelevantItemsForInput(requiredInput: string): string[] {
    const recipes = getRecipesByInputItem(requiredInput);
    const outputNames = recipes.flatMap(recipe => recipe.output.map(output => output.name));
    return [requiredInput, ...outputNames];
}

function RecipeModal({ show, onModalSubmit, RequiredInput, RequiredOutput }: RecipeModalProps) {
    const [selectedItem, setSelectedItem] = useState<string | null>(RequiredOutput ?? null);
    const [searchTerm, setSearchTerm] = useState("");
    const handleClose = () => {
        setSelectedItem(null);
        setSearchTerm("");
        onModalSubmit('none', null);
    }
    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    }

    const handleItemSelect = (classname: string) => {
        if (selectedItem === classname)
            setSelectedItem(null);
        else
            setSelectedItem(classname);
    }

    const relevantItems = useMemo(() => {
        return [... new Set(RequiredOutput ? [RequiredOutput] :
            RequiredInput ? getRelevantItemsForInput(RequiredInput) : getAllItems().map(i => i.className))];
    }, [RequiredInput, RequiredOutput]);

    const filteredItems = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return search !== ""
            ? relevantItems.filter(className => getItem(className)?.displayName.toLowerCase().includes(search))
            : relevantItems;
    }, [relevantItems, searchTerm]);

    const categoryMap = useMemo(() => {
        const map = new Map<string, string[]>();
        // Keep category order
        getAllCategories().forEach(category => map.set(category.category, []));

        // Insert items into correct category
        for (const itemClassName of filteredItems) {
            getItemCategories(itemClassName).forEach(cat => {
                map.get(cat)?.push(itemClassName);
            });
        }

        // Remove empty categories
        for (const [cat, items] of map) {
            if (items.length === 0)
                map.delete(cat);
        }

        return map;
    }, [filteredItems]);

    const recipeList = useMemo(() => {
        if (!selectedItem) return [];
        return getRecipesByOutputItem(selectedItem)
            .filter(r => !RequiredInput || r.input.some(i => i.name === RequiredInput))
            .sort((a, b) => {
                const aIsPrimary = a.output[0]?.name === selectedItem;
                const bIsPrimary = b.output[0]?.name === selectedItem;
                if (aIsPrimary !== bIsPrimary)
                    return aIsPrimary ? -1 : 1;

                const aIsAlt = a.displayName.startsWith("Alternate:");
                const bIsAlt = b.displayName.startsWith("Alternate:");
                if (aIsAlt !== bIsAlt)
                    return aIsAlt ? 1 : -1;

                return 0;
            });
    }, [selectedItem, RequiredInput]);

    const powerRecipes = useMemo(() =>
            selectedItem ? getRecipesByInputItem(selectedItem).filter(r => r.output.length === 0 && r.input[0]?.name === selectedItem) : []
        , [selectedItem]);

    const selectedItemObj = useMemo(() =>
            selectedItem ? getItem(selectedItem) : null
        , [selectedItem]);


    const handleSelect = (type: 'none' | 'recipe' | 'item-spawner' | 'item-end' | 'power', id: string) => {
        onModalSubmit(type, id);
        setSelectedItem(null);
        setSearchTerm("");
    };

    const showEndCards = !RequiredOutput && (!RequiredInput || RequiredInput === selectedItem);

    return (
        <Modal show={show} animation={false} centered onHide={handleClose} dialogClassName="recipe-dialog">
            <Modal.Header closeButton className="w-100">
                <div className="w-100 d-flex flex-row justify-content-between me-2">
                    <Modal.Title>Items</Modal.Title>
                    {!RequiredOutput && (
                        <input type="text" placeholder="Search" value={searchTerm}
                               onChange={handleSearch} className="form-control w-50"/>
                    )}
                </div>
            </Modal.Header>
            <Modal.Body className="smoothScroll row gx-0">
                <CategorySidebar categories={[...categoryMap.keys()]}/>
                <ItemGrid categoryMap={categoryMap} selectedItem={selectedItem} onItemSelect={handleItemSelect}/>
            </Modal.Body>
            {selectedItemObj && (
                <Modal.Footer className="justify-content-start">
                    <div className="w-100">
                        <div className="d-flex flex-row justify-content-between">
                            <h4>Recipes for {selectedItemObj.displayName}</h4>
                            <button className="bg-transparent border-0 text-muted clickable-link"
                                    onClick={() => setSelectedItem(null)}>Exit</button>
                        </div>
                        <hr/>
                        <div className="gap-3 recipeContainer">
                            {!RequiredInput && (
                                <SpawnRecipeCard item={selectedItemObj}
                                                 onSelect={() => handleSelect("item-spawner", selectedItem!)}/>
                            )}
                            {recipeList.map(recipe => (
                                <RecipeCard key={recipe.className} recipe={recipe} selectedItem={selectedItem!}
                                            onSelect={() => handleSelect("recipe", recipe.className)}/>
                            ))}
                            {showEndCards && powerRecipes.map(recipe => (
                                <PowerRecipeCard key={recipe.className} recipe={recipe} item={selectedItemObj}
                                                 onSelect={() => handleSelect("power", recipe.className)}/>
                            ))}
                            {showEndCards && (
                                <CountRecipeCard item={selectedItemObj}
                                                 onSelect={() => handleSelect("item-end", selectedItem!)}/>
                            )}
                        </div>
                    </div>
                </Modal.Footer>
            )}
            <Modal.Footer/>
        </Modal>
    );
}


export default RecipeModal;