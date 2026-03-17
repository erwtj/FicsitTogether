import { useCallback, useState } from "react";
import { Offcanvas, Toast } from "react-bootstrap";
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
import { useFactoryStats, type ItemThroughput, type BuildingCount } from "../../hooks/useFactoryStats";
import { useYjsMetadata } from "../../hooks/useYjsMetadata";
import {roundTo3Decimals, throughputToDisplay} from "../../../utils/throughputUtil";
import "./OverviewSidePanel.css";
import { Link } from "@tanstack/react-router";
import {ClientSettingsModal} from "../../../components/modals/ClientSettingsModal.tsx";
import {MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "dtolib";
import {downloadProject} from "../../../api/apiCalls.ts";
import {useAuth0Context} from "../../../auth/useAuth0Context.ts";

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

// ─── Document info panel ──────────────────────────────────────────────────────

function DocumentInfoPanel({
    show,
    onHide,
}: {
    show: boolean;
    onHide: () => void;
}) {
    const { metadata, setName, setDescription } = useYjsMetadata();

    return (
        <Offcanvas show={show} onHide={onHide} placement="start" scroll backdrop={false}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Document Info</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="d-flex flex-column gap-3">
                    <div>
                        <label htmlFor="doc-name" className="form-label">Document name</label>
                        <input
                            id="doc-name"
                            type="text"
                            className="form-control"
                            value={metadata.name}
                            maxLength={MAX_NAME_LENGTH}
                            onChange={e => setName(e.target.value)}
                            placeholder="No name"
                        />
                    </div>
                    <div>
                        <label htmlFor="doc-description" className="form-label">Document description</label>
                        <textarea
                            id="doc-description"
                            className="form-control"
                            rows={4}
                            value={metadata.description}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="No description"
                        />
                    </div>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function OverviewSidePanel({projectId}: {projectId: string}) {
    const [showPanel, setShowPanel] = useState(false);
    const [showDocInfo, setShowDocInfo] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const handleShow = useCallback(() => setShowPanel(v => !v), []);

    const { metadata } = useYjsMetadata();
    const nodes = useNodes();
    const { inputs, outputs, powerConsumptionMW, powerProductionMW, buildings } =
        useFactoryStats(nodes);

    const netPower = powerProductionMW - powerConsumptionMW;

    const auth = useAuth0Context();
    const [apiError, setApiError] = useState<string | null>(null);

    const handleDownloadProject = async () => {
        downloadProject(auth, projectId).catch((err) => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Cannot download this project. Please try again.');
            } else {
                setApiError('An error occurred while downloading the project. Please try again.');
            }
            console.error('Error downloading project:', err)
        }).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${metadata.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    return (
        <>
            <ChevronRight
                size={20}
                className="text-body opacity-75 clickable-link"
                role="button"
                onClick={handleShow}
            />

            <DocumentInfoPanel show={showDocInfo} onHide={() => setShowDocInfo(false)} />
            <ClientSettingsModal show={showSettings} handleClose={() => setShowSettings(false)} />

            <Offcanvas show={showPanel} onHide={handleShow} placement="start" scroll backdrop={false}>
                <Offcanvas.Header>
                    <Offcanvas.Title>
                        {(metadata.parentDirectoryId && metadata.parentDirectoryId !== "") ?
                            <Link to={"/directories/$dir"} params={{ dir: metadata.parentDirectoryId ?? "" }} className={"text-body-secondary clickable-link"}>
                                <ArrowLeft size={20} className="mb-1 me-3"/>
                            </Link>
                            :
                            <Link to={"/home"} className={"text-body-secondary clickable-link"}>
                                <ArrowLeft size={20} className="mb-1 me-3"/>
                            </Link>
                        }
                        {metadata.name
                            ? <span className="text-white clickable-link" role={"button"} onClick={() => setShowDocInfo(true)}>{metadata.name}</span>
                            : <span className="text-muted fst-italic clickable-link" role={"button"} onClick={() => setShowDocInfo(true)}>No name</span>
                        }
                    </Offcanvas.Title>
                    <div className="d-flex flex-row align-items-center gap-2 ms-auto">
                        <Download size={20} className="text-body-secondary clickable-link ms-auto me-2" role="button" onClick={handleDownloadProject}/>
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

            <Toast show={apiError !== null} onClose={() => setApiError(null)} className="position-fixed top-0 end-0 m-3" delay={5000} autohide>
                <Toast.Header>
                    <strong className="me-auto text-danger">An error occurred</strong>
                </Toast.Header>
                <Toast.Body>{apiError}</Toast.Body>
            </Toast>
        </>
    );
}