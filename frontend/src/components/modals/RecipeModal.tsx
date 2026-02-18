import {useState} from "react";
import {getItemCategory, getRecipesByInputItem, getAllItems, getItem, getRecipesByOutputItem, getBuilding} from "ficlib"
import {Modal, Card} from "react-bootstrap";
import "./RecipeModal.tsx.css";
import {LightningFill} from "react-bootstrap-icons";
import {throughputToDisplay} from "../../utils/throughputUtil.ts";

export type RecipeModalProps = {
    show: boolean;
    onModalSubmit: (type: 'none' | 'recipe' | 'item-extractor' | 'item-spawner' | 'item-end' | 'power',
                    value: string | null) => void;
    RequiredInput: string | null;
    RequiredOutput: string | null;
}

// TODO: Move editor related components, hooks, etc into own directory

function getRelevantItemsForInput(requiredInput: string): Set<string> {
    const recipes = getRecipesByInputItem(requiredInput);
    const relevantItems = new Set<string>([requiredInput]);
    recipes.forEach(recipe => recipe.output.forEach(output => relevantItems.add(output.name)));
    return relevantItems;
}


function RecipeModal({ show, onModalSubmit, RequiredInput, RequiredOutput }: RecipeModalProps) {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
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
        if (selectedItem === classname) setSelectedItem(null);
        else setSelectedItem(classname);
    }

    // TODO: Most functions here should be effects to avoid unnecessary recalculations 
    // Get relevant items based on RequiredInput and RequiredOutput
    let relevantItems: Set<string> = RequiredOutput ? new Set([RequiredOutput]) :
        RequiredInput ? getRelevantItemsForInput(RequiredInput) : new Set(getAllItems().map(i => i.className));

    // Filter relevant items based on search term
    if (searchTerm.trim() !== "") {
        const lowerSearchTerm = searchTerm.toLowerCase();
        relevantItems = new Set(
            [...relevantItems].filter(className =>
                getItem(className)?.displayName.toLowerCase().includes(lowerSearchTerm)
            )
        );
    }

    const categoryMap = new Map<string, string[]>();
    for (const itemClassName of relevantItems) {
        const cat = getItemCategory(itemClassName);
        if (!cat) 
            continue;
        
        const existing = categoryMap.get(cat);
        if (existing) 
            existing.push(itemClassName);
        else 
            categoryMap.set(cat, [itemClassName]);
    }

    const recipeList = selectedItem ? getRecipesByOutputItem(selectedItem)
        .filter(r => !RequiredInput || r.input.some(i => i.name === RequiredInput))
            // TODO: Sorting doesnt work for Heavy Modular Frames (for example)
        .sort((a, b) => {
            const aIsPrimary = a.output[0]?.name === selectedItem;
            const bIsPrimary = b.output[0]?.name === selectedItem;
            
            if (aIsPrimary !== bIsPrimary) 
                return aIsPrimary ? -1 : 1; // Primary recipes first

            const aIsAlt = a.displayName.startsWith("Alt:");
            const bIsAlt = b.displayName.startsWith("Alt:");
            
            if (aIsAlt !== bIsAlt) 
                return aIsAlt ? 1 : -1; // Non-alt recipes first
            
            return 0;
        })
    : [];

    const powerRecipes = selectedItem
        ? getRecipesByInputItem(selectedItem).filter(r => r.output.length === 0)
    : [];

    const selectedItemObj = selectedItem ? getItem(selectedItem) : null;

    // TODO: Needs a total overhaul, split into components, streamline 
    return (
        <Modal show={show} animation={false} centered onHide={handleClose} dialogClassName="recipe-dialog">
            <Modal.Header closeButton className="w-100">
                <div className="w-100 d-flex flex-row justify-content-between me-2">
                    <Modal.Title>Items</Modal.Title>
                    {!RequiredOutput && <input type="text" placeholder="Search" value={searchTerm} onChange={handleSearch} className="form-control w-50"/>}
                </div>
            </Modal.Header>
            <Modal.Body className="smoothScroll row gx-0">
                <div className="col-3">
                    <ol className="sticky-top categoryList">
                        {[...categoryMap.keys()].map(category => (
                            <li key={category}>
                                <button className="text-muted clickable-link"
                                        onClick={() => document.getElementById(category)?.scrollIntoView({behavior: "smooth"})}>
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="col">
                    {[...categoryMap.entries()].map(([category, items]) => (
                        <div key={category} className="mb-3" id={category}>
                            <h4>{category}</h4>
                            <hr/>
                            <div className="d-flex flex-wrap gap-3">
                                {items.map(className => {
                                    const item = getItem(className);
                                    if (!item) return null;
                                    return (
                                        <Card key={className} onClick={() => handleItemSelect(className)}
                                              className={`itemCard${className === selectedItem ? ' selected-card' : ''}`}>
                                            <Card.Img className="p-3 pb-0 w-100" src={`/media/${item.icon}_256.webp`} draggable={false} loading="lazy"/>
                                            <Card.Footer className="w-100 bg-transparent border-0">
                                                <Card.Title className="text-center">{item.displayName}</Card.Title>
                                            </Card.Footer>
                                        </Card>
                                    )})}
                            </div>
                        </div>
                    ))}
                </div>
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
                                <div onClick={() => { onModalSubmit("item-spawner", selectedItem); setSelectedItem(null); setSearchTerm(""); }}
                                     className="recipeCard p-2 fs-8">
                                    <div className="d-flex flex-row gap-1 pe-2">
                                        <div className="left-col text-center">
                                            <img alt={selectedItemObj.displayName} className="recipeBigIcon"
                                                 src={`/media/${selectedItemObj.icon}_256.webp`} draggable={false}/>
                                        </div>
                                        <div className="flex-fill text-start pe-2">
                                            <h6 className="fs-7">Spawn {selectedItemObj.displayName}</h6>
                                            <span className="text-muted">Spawn output</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {recipeList.map(recipe => {
                                const mainOutputEntry = recipe.output.find(o => o.name === selectedItem);
                                const mainOutputItem = getItem(recipe.output[0]?.name);
                                const secondaryOutputItem = getItem(recipe.output[1]?.name);
                                if (!mainOutputEntry || !mainOutputItem) return null;

                                const buildingDisplayName = getBuilding(recipe.producedIn)?.displayName || recipe.producedIn;

                                return (
                                    <div key={recipe.className} onClick={() => { onModalSubmit("recipe", recipe.className); setSelectedItem(null); setSearchTerm(""); }}
                                         className="recipeCard p-2 fs-8">
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
                                                {recipe.input.map(input => {
                                                    const inputItem = getItem(input.name);
                                                    if (!inputItem) return null;
                                                    return (
                                                        <div key={input.name}>
                                                            <img alt={inputItem.displayName} className="recipeTinyIcon"
                                                                 src={`/media/${inputItem.icon}_256.webp`} draggable={false}/>
                                                            <span>{throughputToDisplay(inputItem.className, 60 / recipe.duration * input.amount)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {!RequiredOutput && (!RequiredInput || RequiredInput === selectedItem) && powerRecipes.map(recipe => (
                                <div key={recipe.className} onClick={() => { onModalSubmit("power", recipe.className); setSelectedItem(null); setSearchTerm(""); }}
                                     className="recipeCard p-2 fs-8" style={{minHeight: "80px"}}>
                                    <div className="d-flex flex-row gap-1 pe-2">
                                        <div className="left-col text-center">
                                            <img alt={selectedItemObj.displayName} className="recipeBigIcon"
                                                 src={`/media/${selectedItemObj.icon}_256.webp`} draggable={false}/>
                                            <LightningFill className="recipeSmallIcon lightning" size={25}/>
                                        </div>
                                        <div className="flex-fill text-start">
                                            <h6 className="fs-7">{recipe.displayName}</h6>
                                            <span className="text-muted">{recipe.producedIn}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex flex-row gap-1 mt-2">
                                        <div className="text-center left-col">
                                            <span>MW</span>
                                        </div>
                                        <div className="d-flex flex-row flex-wrap gap-2">
                                            {recipe.input.map(input => {
                                                const inputItem = getItem(input.name);
                                                if (!inputItem) return null;
                                                return (
                                                    <div key={input.name}>
                                                        <img alt={inputItem.displayName} className="recipeTinyIcon"
                                                             src={`/media/${inputItem.icon}_256.webp`} draggable={false}/>
                                                        <span>{throughputToDisplay(inputItem.className, 60 / recipe.duration * input.amount)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!RequiredOutput && (!RequiredInput || RequiredInput === selectedItem) && (
                                <div onClick={() => { onModalSubmit("item-end", selectedItem); setSelectedItem(null); setSearchTerm(""); }}
                                     className="recipeCard p-2 fs-8" style={{minHeight: "80px"}}>
                                    <div className="d-flex flex-row gap-1 pe-2">
                                        <div className="left-col text-center">
                                            <img alt={selectedItemObj.displayName} className="recipeBigIcon"
                                                 src={`/media/${selectedItemObj.icon}_256.webp`} draggable={false}/>
                                        </div>
                                        <div className="flex-fill text-start pe-2">
                                            <h6 className="fs-7">Count {selectedItemObj.displayName}</h6>
                                            <span className="text-muted">Count input</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal.Footer>
            )}
            <Modal.Footer/>
        </Modal>
    )
}


export default RecipeModal;