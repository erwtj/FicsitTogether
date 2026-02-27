import { useCallback, useState } from "react";
import { Offcanvas } from "react-bootstrap";
import {
    BoxArrowDown,
    BoxArrowInDown,
    Buildings,
    ChevronRight,
    LightningFill,
} from "react-bootstrap-icons";
import { useNodes } from "@xyflow/react";
import { useFactoryStats, type ItemThroughput, type BuildingCount } from "../../hooks/useFactoryStats";
import { useYjsMetadata } from "../../hooks/useYjsMetadata";
import { throughputToDisplay } from "../../../utils/throughputUtil";

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
    const { metadata, setTitle, setDescription } = useYjsMetadata();

    return (
        <Offcanvas show={show} onHide={onHide} placement="start" scroll backdrop={false}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Document Info</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="d-flex flex-column gap-3">
                    <div>
                        <label htmlFor="doc-title" className="form-label">Title</label>
                        <input
                            id="doc-title"
                            type="text"
                            className="form-control"
                            value={metadata.name}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="No name"
                        />
                    </div>
                    <div>
                        <label htmlFor="doc-description" className="form-label">Description</label>
                        <textarea
                            id="doc-description"
                            className="form-control"
                            rows={4}
                            value={metadata.description}
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

export function OverviewSidePanel() {
    const [showPanel, setShowPanel] = useState(false);
    const [showDocInfo, setShowDocInfo] = useState(false);
    const handleShow = useCallback(() => setShowPanel(v => !v), []);

    const { metadata } = useYjsMetadata();
    const nodes = useNodes();
    const { inputs, outputs, powerConsumptionMW, powerProductionMW, buildings } =
        useFactoryStats(nodes);

    const netPower = powerProductionMW - powerConsumptionMW;

    return (
        <>
            <ChevronRight
                size={20}
                className="text-body opacity-75"
                role="button"
                onClick={handleShow}
            />

            <DocumentInfoPanel show={showDocInfo} onHide={() => setShowDocInfo(false)} />

            <Offcanvas show={showPanel} onHide={handleShow} placement="start" scroll backdrop={false}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        <button
                            className="border-0 bg-transparent p-0 text-start clickable-link"
                            onClick={() => setShowDocInfo(true)}
                            title="Edit document info"
                        >
                            {metadata.name
                                ? <span>{metadata.name}</span>
                                : <span className="text-muted fst-italic">No name</span>
                            }
                        </button>
                    </Offcanvas.Title>
                </Offcanvas.Header>

                <Offcanvas.Body>
                    <div className="d-flex flex-column gap-3">

                        {/* ── Inputs ── */}
                        <section>
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <BoxArrowInDown /> Input
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <ItemList items={inputs} />
                            </ul>
                        </section>

                        <hr className="my-0" />

                        {/* ── Outputs ── */}
                        <section>
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <BoxArrowDown /> Output
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <ItemList items={outputs} />
                            </ul>
                        </section>

                        <hr className="my-0" />

                        {/* ── Power ── */}
                        <section>
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <LightningFill /> Power
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <li className="text-body">
                                    Consumption:{" "}
                                    <span className="text-body-secondary">
                                        {powerConsumptionMW}
                                    </span>{" "}
                                    MW
                                </li>
                                <li className="text-body">
                                    Production:{" "}
                                    <span className="text-body-secondary">
                                        {powerProductionMW}
                                    </span>{" "}
                                    MW
                                </li>
                                <li className="text-body">
                                    Net:{" "}
                                    <span className={netPower >= 0 ? "text-success" : "text-danger"}>
                                        {netPower > 0 ? "+" : ""}
                                        {netPower}
                                    </span>{" "}
                                    MW
                                </li>
                            </ul>
                        </section>

                        <hr className="my-0" />

                        {/* ── Buildings ── */}
                        <section>
                            <h5 className="d-flex align-items-center gap-2 mb-2">
                                <Buildings /> Buildings
                            </h5>
                            <ul className="list-unstyled mb-0">
                                <BuildingList buildings={buildings} />
                            </ul>
                        </section>

                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
}