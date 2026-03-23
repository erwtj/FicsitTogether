const CategorySidebar = ({ categories }: { categories: string[] }) => (
    <div className="d-none d-md-block col-3">
        <ol className="sticky-top categoryList">
            {categories.map(category => (
                <li key={category}>
                    <button className="text-muted clickable-link"
                            onClick={() => document.getElementById(category)?.scrollIntoView({ behavior: "smooth" })}>
                        {category}
                    </button>
                </li>
            ))}
        </ol>
    </div>
);

export default CategorySidebar;