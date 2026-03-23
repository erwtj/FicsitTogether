import { useCallback, useState } from "react";
import { Offcanvas } from "react-bootstrap";
import {
    ArrowLeft,
    BoxArrowDown,
    BoxArrowInDown,
    Buildings,
    ChevronRight,
    Download,
    Gear,
    LightningFill,
} from "react-bootstrap-icons";
import { useNodes } from "@xyflow/react";
import { useFactoryStats, type ItemThroughput, type BuildingCount } from "../../editor/hooks/useFactoryStats";
import {roundTo3Decimals, throughputToDisplay} from "../../utils/throughputUtil.ts";
import "./OverviewSidePanel.css";
import { Link } from "@tanstack/react-router";
import {ClientSettingsModal} from "../../components/modals/ClientSettingsModal.tsx";
import type { PublicProjectDTO } from "dtolib";

// ─── Item / Building list renderers ──────────────────────────────────────────

function ItemList({ items }: { items: ItemThroughput[] }) {
    if (items.length === 0) return <li className="text-body-secondary fst-italic">None</li>;
    return (
        <>
            {items.map(({ className, displayName, icon, amountPerMin }) => (
                <li key={className} className="d-flex align-items-center gap-2 mb-1">
                    <img
                        src={`/media/${icon}_256.webp`}
                        alt={displayName}
                        style={{ width: 24, height: 24, objectFit: "contain" }}
                        draggable={false}
                    />
                    <span className="text-body">{displayName}:</span>
                    <span className="text-body-secondary">
                        {throughputToDisplay(className, amountPerMin)}
                    </span>
                </li>
            ))}
        </>
    );
}

function BuildingList({ buildings }: { buildings: BuildingCount[] }) {
    if (buildings.length === 0)
        return <li className="text-body-secondary fst-italic">None</li>;
    return (
        <>
            {buildings.map(({ className, displayName, icon, count }) => (
                <li key={className} className="d-flex align-items-center gap-2 mb-1">
                    <img
                        src={`/media/${icon}_256.webp`}
                        alt={displayName}
                        style={{ width: 24, height: 24, objectFit: "contain" }}
                        draggable={false}
                    />
                    <span className="text-body">{displayName}:</span>
                    <span className="text-body-secondary">{count}</span>
                </li>
            ))}
        </>
    );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function OverviewSidePanel({project}: {project: PublicProjectDTO}) {
    const [showPanel, setShowPanel] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const handleShow = useCallback(() => setShowPanel(v => !v), []);

    const nodes = useNodes();
    const { inputs, outputs, powerConsumptionMW, powerProductionMW, buildings } =
        useFactoryStats(nodes);

    const netPower = powerProductionMW - powerConsumptionMW;

    const handleDownloadProject = async () => {
        const chart = JSON.stringify({
            name: project.name,
            description: project.description,
            chart: {nodes: project.chart.nodes, edges: project.chart.edges}
        });
        
        const blob = new Blob([chart], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <ChevronRight
                size={20}
                className="text-body opacity-75 clickable-link"
                role="button"
                onClick={handleShow}
            />

            <ClientSettingsModal show={showSettings} handleClose={() => setShowSettings(false)} />

            <Offcanvas show={showPanel} onHide={handleShow} placement="start" scroll backdrop={false}>
                <Offcanvas.Header>
                    <Offcanvas.Title>
                        <Link to={"/view/directories/$dir"} params={{ dir: project.directoryId }} className={"text-body-secondary clickable-link"}>
                            <ArrowLeft size={20} className="mb-1 me-3"/>
                        </Link>
                        {project.name !== ""
                            ? <span className="text-white clickable-link" role={"button"}>{project.name}</span>
                            : <span className="text-muted fst-italic clickable-link" role={"button"}>No name</span>
                        }
                    </Offcanvas.Title>
                    <div className="d-flex flex-row align-items-center gap-2 ms-auto">
                        <Download size={20} className="text-body-secondary clickable-link me-2" role="button" onClick={handleDownloadProject}/>
                        <Gear size={20} className="text-body-secondary clickable-link" role="button"
                              onClick={() => setShowSettings(true)}/>
                        <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowPanel(false)}></button>
                    </div>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <div className="d-flex flex-column gap-3">
                        <section className="sidepanel-section">
                            <h5 className="d-flex align-items-center gap-2 mb-2" style={{marginBottom: "-0px"}}>
                                <BoxArrowInDown style={{marginBottom: "0px"}}/> Input
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <ItemList items={inputs} />
                            </ul>
                        </section>

                        <section className="sidepanel-section">
                            <h5 className="d-flex align-items-center gap-2 mb-2" style={{marginBottom: "-3px"}}>
                                <BoxArrowDown style={{marginTop: "3px"}}/> Output
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <ItemList items={outputs} />
                            </ul>
                        </section>
                        
                        <section className="sidepanel-section">
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <Buildings /> Buildings
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <BuildingList buildings={buildings} />
                            </ul>
                        </section>
                        
                        <section className="sidepanel-section">
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <LightningFill /> Power
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <li className="text-body">
                                    Consumption:{" "}
                                    <span className="text-body-secondary">
                                        {roundTo3Decimals(powerConsumptionMW)}
                                    </span>{" "}
                                    MW
                                </li>
                                <li className="text-body">
                                    Production:{" "}
                                    <span className="text-body-secondary">
                                        {roundTo3Decimals(powerProductionMW)}
                                    </span>{" "}
                                    MW
                                </li>
                                <li className="text-body">
                                    Net:{" "}
                                    <span className={netPower >= 0 ? "text-success" : "text-danger"}>
                                        {netPower > 0 ? "+" : ""}
                                        {roundTo3Decimals(netPower)}
                                    </span>{" "}
                                    MW
                                </li>
                            </ul>
                        </section>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}