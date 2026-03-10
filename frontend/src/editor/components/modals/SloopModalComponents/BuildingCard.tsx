import {type Building, type Recipe, type Item} from "ficlib";
import type {SloopData} from "../../../types.ts";
import { Card, Form, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import "../SloopModal.tsx.css";
import {useEffect, useMemo, useState } from "react";
import {cleanThroughputToDisplay} from "../../../../utils/throughputUtil.ts";
import {X} from "react-bootstrap-icons";
const SOMERSLOOPIMAGE = "/media/FactoryGame/Prototype/WAT/UI/Wat_1_256.webp"

export type BuildingCardProps = {
    index: number;
    building: Building;
    recipe: Recipe;
    producedItem: Item;
    sloopData: SloopData;
    onSloopDataChange: (index: number, newSloopData: SloopData) => void;
    onCardRemove: (index: number) => void;
}


export function BuildingCard({ index, building, recipe, producedItem, sloopData, onSloopDataChange, onCardRemove}: BuildingCardProps) {
    const [localData, setLocalData] = useState<SloopData>(sloopData);

    useEffect(() => {
        setLocalData(sloopData);
    }, [sloopData]);

    const producedPerPrecentage = useMemo(() => (recipe.output[0].amount * 60 / recipe.duration) / 100, [recipe]);

    const handleDataChange = (newData: Partial<SloopData>) => {
        const updatedData = { ...localData, ...newData };
        setLocalData(updatedData);
        onSloopDataChange(index, updatedData);
    }

    // TODO: implement the user settings
    const showTooltip = true

    return (
        <Card key={index} className={`buildingCard text-center`}>
            <button
                onClick={() => onCardRemove(index)}
                className="removeBuildingButton"
                aria-label="Remove building"
            >
                <X size={20} />
            </button>
            <Card.Img className="p-3 inputCardImage center no-drag" src={`/media/${building.icon}_256.webp`} draggable={false}/>
            <Card.Title>
                <h3 className="inputCardTitle">{building.displayName} #{index + 1}</h3>
            </Card.Title>
            <Card.Body>
                <InputGroup className="mb-3 somersloopInput">
                    <InputGroup.Text className="w-25 p-1">
                        <OverlayTrigger
                            placement="left"
                            show={showTooltip ? undefined : false}
                            overlay={<Tooltip id="sloop-tooltip">Somersloop count</Tooltip>}
                        ><img alt="somer sloop" className="w-100 h-100 p-0" src={SOMERSLOOPIMAGE}/>
                        </OverlayTrigger>
                    </InputGroup.Text>
                    <Form.Select
                        value={localData.sloopAmount}
                        onChange={
                        (e) => handleDataChange({ sloopAmount: Number(e.target.value)})}
                    >
                        {Array.from({ length: (building.somersloopsNeeded ?? 0) + 1 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                        ))}
                    </Form.Select>
                    <InputGroup.Text className="w-25 p-1 justify-content-center">
                        /{building.somersloopsNeeded}
                    </InputGroup.Text>
                </InputGroup>
                <InputGroup className="mb-3 somersloopInput">
                    <InputGroup.Text className="w-25 p-1">
                        <OverlayTrigger
                            placement="left"
                            show={showTooltip ? undefined : false}
                            overlay={<Tooltip id="sloop-tooltip">Items produced</Tooltip>}
                        >
                        <img alt="somer sloop" className="w-100 h-100 p-0" src={`/media/${producedItem.icon}_256.webp`}/>
                        </OverlayTrigger>
                    </InputGroup.Text>
                    <Form.Control
                        value={sloopData.overclockPercentage === 0 ? "" : cleanThroughputToDisplay(producedItem.className, sloopData.overclockPercentage * producedPerPrecentage)}
                        onChange = {(e) => {
                            const newPercentage = Number(e.target.value) / producedPerPrecentage;
                            handleDataChange({ overclockPercentage: Math.max(0, Math.min(250, newPercentage)) });
                        }}
                        type="number"
                        step="0.001"
                        className="w-50"
                        placeholder="0"
                    />
                    <InputGroup.Text className="w-25 p-1 justify-content-center">
                        p/m
                    </InputGroup.Text>
                </InputGroup>
                <InputGroup className="mb-3 somersloopInput">
                    <InputGroup.Text className="w-25 p-1">
                        <OverlayTrigger
                            placement="left"
                            show={showTooltip ? undefined : false}
                            overlay={<Tooltip id="sloop-tooltip">Overclock</Tooltip>}
                        >
                            <img alt="somer sloop" className="w-100 h-100 p-0" src="/media/Clock_speed.webp"/>
                        </OverlayTrigger>
                    </InputGroup.Text>
                    <Form.Control
                        value={localData.overclockPercentage === 0 ? "" : parseFloat(localData.overclockPercentage.toFixed(4))}
                        onChange={(e) => handleDataChange({ overclockPercentage: Math.max(0, Math.min(250, Number(e.target.value))) })}
                        type="number"
                        step="0.0001"
                        max={250}
                        min={0}
                        placeholder="0"
                    />
                    <InputGroup.Text className="w-25 p-1 justify-content-center">
                        %
                    </InputGroup.Text>
                </InputGroup>
                <InputGroup className="mb-3 somersloopInput">
                    <InputGroup.Text className="w-25 p-1">
                        <OverlayTrigger
                            placement="left"
                            show={showTooltip ? undefined : false}
                            overlay={<Tooltip id="sloop-tooltip">Effective overclock</Tooltip>}
                        >
                            <img alt="somer sloop" className="w-100 h-100 p-0" src="/media/AlienOverclocking.webp"/>
                        </OverlayTrigger>
                    </InputGroup.Text>
                    <Form.Control
                        value={localData.overclockPercentage === 0 ? "" : parseFloat((localData.overclockPercentage * (1 + localData.sloopAmount/building.somersloopsNeeded)).toFixed(4))}
                        type="number"
                        className="w-50"
                        placeholder="0"
                        disabled
                        readOnly
                    />
                    <InputGroup.Text className="w-25 p-1 justify-content-center">
                        %
                    </InputGroup.Text>
                </InputGroup>
            </Card.Body>
        </Card>
    )
}