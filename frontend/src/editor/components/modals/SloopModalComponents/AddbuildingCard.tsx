import { Card } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";


export type AddBuildingCardProps = {
    onBuildingAdded: () => void;
}

export function AddBuildingCard({ onBuildingAdded }: AddBuildingCardProps) {
    return (
        <Card
            className="buildingCard text-center d-flex align-items-center justify-content-center addBuildingCard"
            onClick={onBuildingAdded}
        >
            <div className="addBuildingCardContent" style={{ color: "#a3a9b3", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Plus size={46} color="currentColor"/>
                <span>Add Building</span>
            </div>
        </Card>
    )
}
