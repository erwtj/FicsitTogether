import {useNodes} from "@xyflow/react";
import type {RecipeNodeType, SloopData} from "../../types.ts";
import {getBuilding, getItem, getRecipe } from "ficlib";
import {useMemo, useState } from "react";
import "./SloopModal.tsx.css"
import {Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import {useYjsMutation} from "../../hooks/useYjsMutation.ts";
import {AddBuildingCard} from "./SloopModalComponents/AddbuildingCard.tsx";
import {BuildingCard} from "./SloopModalComponents/BuildingCard.tsx";
import {roundTo4Decimals} from "../../../utils/throughputUtil.ts";

export type SloopModalProps = {
    show: boolean;
    nodeId: string;
    onModalClose: () => void;
}

export function SloopModal({ show, nodeId, onModalClose }: SloopModalProps) {
    const nodes = useNodes()
    const node = useMemo(() => nodes.find(n => n.id === nodeId) as (RecipeNodeType | null) ?? null, [nodes, nodeId]);

    const {updateNodeData} = useYjsMutation();

    const [allSloopData, setAllSloopData] = useState<SloopData[]>(node?.data.sloopData ?? []);

    const recipe = useMemo(() => getRecipe(node?.data.recipeClassName ?? "")!, [node?.data.recipeClassName]);
    const building = useMemo(() => getBuilding(recipe?.producedIn)!, [recipe?.producedIn]);
    const producedItem = useMemo(() => getItem(recipe?.output[0].name)!, [recipe?.output]);

    const rawFactor = useMemo(() => node?.data._rawFactor, [node?.data._rawFactor]);

    // Determine if the current sloop data is valid based on the raw factor and the factor mode.
    // If input-driven, we check if the total overclock percentage is less than or equal to the input factor.
    // If output-driven, we check if the total effective percentage is less than or equal to the output factor.
    const [dataIsValid, inputMode] = useMemo(() => {
        if (rawFactor?.inputFactor != 0) {
            const totalPercentage = allSloopData.reduce((sum, data) => sum + data.overclockPercentage, 0);
            return [roundTo4Decimals(totalPercentage) - roundTo4Decimals((rawFactor?.inputFactor ?? 1) * 100) <= 0.000099,'input']
        }
        else if (rawFactor?.outputFactor != 0) {
            const somersloopsNeeded = building?.somersloopsNeeded ?? 1;
            const totalEffectivePercentage = allSloopData.reduce((sum, data) => sum + ((1 + (data.sloopAmount / somersloopsNeeded)) * data.overclockPercentage), 0);
            return [roundTo4Decimals(totalEffectivePercentage) - roundTo4Decimals((rawFactor?.outputFactor ?? 1) * 100) <= 0.000099, 'output']
        }
        else return [true, 'none']
    }, [allSloopData, building?.somersloopsNeeded, rawFactor?.inputFactor, rawFactor?.outputFactor]);

    const handleSloopDataChange = (index: number, newSloopData: SloopData) => {
        setAllSloopData(prev => {
            const updated = [...prev];
            updated[index] = newSloopData;
            return updated;
        });
    }

    const handleRemoveBuildingCard = (index: number) => {
        setAllSloopData(prev => prev.filter((_, i) => i !== index));
    }

    const handleAddBuilding = () => {
        setAllSloopData(prev => [...prev, { sloopAmount: 0, overclockPercentage: 100 }]);
    }

    const handleClose = () => {
        onModalClose();
    }

    const handleSubmit = () => {
        updateNodeData(nodeId, { sloopData: allSloopData });
        onModalClose();
    }

    //TODO: implement the user settings
    const showTooltip = true

    return (
        <Modal size="xl" show={show} onHide={handleClose} scrollable>
            <Modal.Header closeButton>
                <div className="d-flex align-items-center w-100 me-2">
                    <Modal.Title className={`me-auto`}>
                        Configure Somerslooping
                    </Modal.Title>
                    {inputMode === "input" && (
                        <span className="text-muted d-flex align-items-center gap-2">
                            <OverlayTrigger
                                placement="left"
                                show={showTooltip ? undefined : false}
                                overlay={<Tooltip id="sloop-tooltip">Overclock</Tooltip>}
                            >
                            <img alt="somer sloop"
                                 className="p-0"
                                 src="/media/Clock_speed.webp"
                                 style={{width: 24, height: 24}}

                            />
                            </OverlayTrigger>
                            <span>Total overclock:</span>
                            <span className={`fw-bold ${dataIsValid ? "text-success" : "text-danger"}`}>
                                {roundTo4Decimals(allSloopData.reduce((sum, data) => sum + data.overclockPercentage, 0))}
                                <span className="me-1">%</span>
                                <span>{dataIsValid ? "<" : ">"}</span>
                                <span className="fw-bold ms-1">{roundTo4Decimals((rawFactor?.inputFactor ?? 1) * 100)}</span>
                                <span>%</span>
                            </span>
                        </span>
                    )}
                    {inputMode === "output" && (
                        <span className="text-muted d-flex align-items-center gap-2">
                            <OverlayTrigger
                                placement="left"
                                show={showTooltip ? undefined : false}
                                overlay={<Tooltip id="sloop-tooltip">Effective overclock</Tooltip>}
                            >
                            <img alt="somer sloop"
                                 className="p-0"
                                 src="/media/AlienOverclocking.webp"
                                 style={{width: 24, height: 24}}

                            />
                            </OverlayTrigger>
                            <span>Total effective overclock:</span>
                            <span className={`fw-bold ${dataIsValid ? "text-success" : "text-danger"}`}>
                                {roundTo4Decimals(allSloopData.reduce((sum, data) => sum + (data.overclockPercentage * (1 + data.sloopAmount/building.somersloopsNeeded)), 0))}
                                <span className="me-1">%</span>
                                <span>{dataIsValid ? "<" : ">"}</span>
                                <span className="fw-bold ms-1">{roundTo4Decimals((rawFactor?.outputFactor ?? 1) * 100)}</span>
                                <span>%</span>
                            </span>
                        </span>
                    )}
                </div>
            </Modal.Header>
            <Modal.Body>
                <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: "center", alignItems: "stretch"}}>
                    {allSloopData.map((item, index) => (
                        <BuildingCard
                            key={index}
                            index={index}
                            building={building}
                            recipe={recipe}
                            producedItem={producedItem}
                            sloopData={item}
                            onSloopDataChange={handleSloopDataChange}
                            onCardRemove={handleRemoveBuildingCard}
                        />
                    ))}
                    <AddBuildingCard onBuildingAdded={handleAddBuilding} />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={handleClose}>Close</button>
                <OverlayTrigger
                    placement="top"
                    show={!dataIsValid ? undefined : false}
                    overlay={
                        <Tooltip id="save-tooltip">
                            {inputMode === "input"
                                ? `Total overclock exceeds the maximum allowed (${roundTo4Decimals((rawFactor?.inputFactor ?? 1) * 100)}%)`
                                : `Total effective overclock exceeds the maximum allowed (${roundTo4Decimals((rawFactor?.outputFactor ?? 1) * 100)}%)`
                            }
                        </Tooltip>
                    }
                >
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!dataIsValid}
                    style={!dataIsValid ? { pointerEvents: 'none' } : undefined}
                >
                    Save changes
                </button>
                </OverlayTrigger>
            </Modal.Footer>
        </Modal>
    )

}