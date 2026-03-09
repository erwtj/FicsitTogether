import ItemCard from "./ItemCard.tsx";

const ItemGrid = ({ categoryMap, selectedItem, onItemSelect }: {
    categoryMap: Map<string, string[]>,
    selectedItem: string | null,
    onItemSelect: (className: string) => void
}) => (
    <div className="col">
        {[...categoryMap.entries()].map(([category, items]) => (
            <div key={category} className="mb-3" id={category}>
                <h4>{category}</h4>
                <hr/>
                <div className="d-flex flex-wrap gap-3">
                    {items.map(className => (
                        <ItemCard key={className} className={className}
                                  isSelected={className === selectedItem}
                                  onClick={() => onItemSelect(className)}/>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default ItemGrid;