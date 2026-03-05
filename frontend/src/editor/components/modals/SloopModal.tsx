import { useReactFlow } from "@xyflow/react";
import type {SloopData} from "../../types.ts";
import type {RecipeNodeType} from "../../types.ts";
import {getBuilding, getItem, getRecipe } from "ficlib";
import { useState } from "react";
import "./SloopModal.tsx.css"
import {Card, Form, InputGroup, Modal } from "react-bootstrap";
import {roundTo3Decimals} from "../../../utils/throughputUtil.ts";
import {useYjsMutation} from "../../hooks/useYjsMutation.ts";

const SOMERSLOOPIMAGE = "/media/FactoryGame/Prototype/WAT/UI/Wat_1_256.webp"

export type SloopModalProps = {
    show: boolean;
    nodeId: string;
    onModalSubmit: () => void;
}

export function SloopModal({ show, nodeId, onModalSubmit }: SloopModalProps) {
    const reactFlow = useReactFlow();
    const node = reactFlow.getNode(nodeId) as (RecipeNodeType | null);
    
    const {updateNodeData} = useYjsMutation(); 

    const [buildingAmount, setBuildingAmount] = useState<number>(node?.data.sloopData?.length ?? 0);
    const [sloopData, setSloopData] = useState<SloopData[] | null>(node?.data.sloopData ?? null);

    if (!node) {
        return <div></div>;
    }

    const recipe = getRecipe(node.data.recipeClassName)!;
    const building = getBuilding(recipe.producedIn)!;
    const producedItem = getItem(recipe.output[0].name)!;

    const handleClose = () => {
        onModalSubmit();
    }

    const handleSubmit = () => {
        updateNodeData(nodeId, { sloopData });
        onModalSubmit();
    }

    const handleBuildingAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const amount = Math.max(0, Math.floor(Number(event.target.value)));
        setBuildingAmount(amount);
    }

    if (buildingAmount !== (sloopData?.length ?? 0)) {
        if (buildingAmount === 0) {
            setSloopData(null);
        } else if ((sloopData?.length ?? 0) > buildingAmount) {
            setSloopData(sloopData!.slice(0, buildingAmount));
        } else if ((sloopData?.length ?? 0) < buildingAmount) {
            setSloopData([...(sloopData ?? []), ...Array(buildingAmount - (sloopData?.length ?? 0)).fill({ sloopAmount: 0, overclockPercentage: 100 })]);
        }
    }

    function inputCard(data: SloopData, index: number) {
        const maxSloops = building.somersloopsNeeded ?? 0;
        const options = Array.from({ length: maxSloops + 1 }, (_, i) => i);

        const producedPerPercentage = (recipe.output[0].amount * 60 / recipe.duration) / 100;

        return (
            <Card key={index} className={"inputCard text-center "}>
                <Card.Img className="p-3 inputCardImage center no-drag" src={`/media/${building.icon}_256.webp`} draggable={false}/>
                <Card.Title>
                    <h3 className="inputCardTitle">Building #{index + 1}</h3>
                </Card.Title>
                <Card.Body>
                    <InputGroup className="mb-1 somersloopInput">
                        <InputGroup.Text className="w-25 p-1">
                            <img alt="somer sloop" className="w-100 h-100 p-0" src={SOMERSLOOPIMAGE}/>
                        </InputGroup.Text>
                        <Form.Select
                            value={data.sloopAmount}
                            onChange={(e) => {
                                const updated = [...(sloopData ?? [])];
                                updated[index] = { ...updated[index], sloopAmount: Number(e.target.value) };
                                setSloopData(updated);
                            }}
                        >
                            {options.map((val) => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </Form.Select>
                        <InputGroup.Text className="w-25 p-1 justify-content-center">
                            /{maxSloops}
                        </InputGroup.Text>
                    </InputGroup>
                    <InputGroup className="mb-1 somersloopInput">
                        <InputGroup.Text className="w-25 p-1">
                            <img alt="somer sloop" className="w-100 h-100 p-0" src={`/media/${producedItem.icon}_256.webp`}/>
                        </InputGroup.Text>
                        <Form.Control
                            value={data.overclockPercentage * producedPerPercentage === 0 ? "" : roundTo3Decimals(data.overclockPercentage * producedPerPercentage)}
                            onChange={(e) => {
                                const amount = Number(e.target.value) / producedPerPercentage;
                                const updated = [...(sloopData ?? [])];
                                updated[index] = { ...updated[index], overclockPercentage: Math.max(0, Math.min(250, amount)) };
                                setSloopData(updated);
                            }}
                            type="number"
                            step="0.001"
                            className="w-50"
                            placeholder="0"
                        >
                        </Form.Control>
                        <InputGroup.Text className="w-25 p-1 justify-content-center">
                            p/m
                        </InputGroup.Text>
                    </InputGroup>
                    <InputGroup className="mb-1 somersloopInput">
                        <InputGroup.Text className="w-25 p-1">
                            <img alt="somer sloop" className="w-100 h-100 p-0" src="/media/Clock_speed.webp"/>
                        </InputGroup.Text>
                        <Form.Control
                            value={data.overclockPercentage === 0 ? "" : parseFloat(data.overclockPercentage.toFixed(4))}
                            onChange={(e) => {
                                const updated = [...(sloopData ?? [])];
                                updated[index] = { ...updated[index], overclockPercentage: Math.max(0, Math.min(250, Number(e.target.value))) };
                                setSloopData(updated);
                            }}
                            type="number"
                            step="0.0001"
                            max={250}
                            min={0}
                            placeholder="0"
                        >
                        </Form.Control>
                        <InputGroup.Text className="w-25 p-1 justify-content-center">
                            %
                        </InputGroup.Text>
                    </InputGroup>
                </Card.Body>

            </Card>
        )
    }

    return (
        <Modal size="xl" show={show} onHide={handleClose} scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Configure Somersloops</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <span className="center-container"><h3>Amount of slooped buildings:</h3></span>
                <div className="center-container m-1">
                    <input type="number" className="sloopInputField nodrag" placeholder={"0"} step="1" min="0"
                           value={buildingAmount !== 0 ? buildingAmount : ""} id={"input-1"} inputMode={"numeric"}
                           onChange={handleBuildingAmountChange}/>
                </div>
                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: "center", alignItems: "center"}}>
                    {sloopData?.map((data, index) => inputCard(data, index))}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={handleClose}>Close</button>
                <button className="btn btn-primary"
                        onClick={handleSubmit}>Save changes</button>
            </Modal.Footer>
        </Modal>
    )
}