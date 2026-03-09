import {Card} from "react-bootstrap";
import {getItem} from "ficlib";

const ItemCard = ({ className, isSelected, onClick }: { className: string, isSelected: boolean, onClick: () => void }) => {
    const item = getItem(className);
    if (!item) return null;
    return (
        <Card onClick={onClick} className={`itemCard${isSelected ? ' selected-card' : ''}`}>
            <Card.Img className="p-3 pb-0 w-100" src={`/media/${item.icon}_256.webp`} draggable={false} loading="lazy" decoding="async"/>
            <Card.Footer className="w-100 bg-transparent border-0">
                <Card.Title className="text-center">{item.displayName}</Card.Title>
            </Card.Footer>
        </Card>
    );
};

export default ItemCard;