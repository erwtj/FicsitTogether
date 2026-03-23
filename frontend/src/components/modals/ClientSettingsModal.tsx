import "./ClientSettingsModal.tsx.css";

import {Modal, Form} from "react-bootstrap";
import {useClientSettings} from "../../hooks/useClientSettings.ts";


type ClientSettingsModalProps = {
    show: boolean;
    handleClose: () => void;
}

export const ClientSettingsModal = ({show, handleClose}: ClientSettingsModalProps) => {
    const { clientSettings, updateClientSettings } = useClientSettings();

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
    }

    const setMinimapEnabled = (minimapEnabled: boolean) => {
        updateClientSettings({minimapEnabled: minimapEnabled});
    }

    const setMinimapColors = (minimapColors: boolean) => {
        updateClientSettings({minimapColors: minimapColors});
    }

    const setSnappingEnabled = (snappingEnabled: boolean) => {
        updateClientSettings({snappingEnabled: snappingEnabled});
    }

    const setSnapSize = (snapSize: number) => {
        updateClientSettings({snapSize: snapSize});
    }

    const setShowToolTips = (showToolTips: boolean) => {
        updateClientSettings({showToolTips: showToolTips});
    }

    const setEnableIONetto = (enableIONetto: boolean) => {
        updateClientSettings({enableIONetto: enableIONetto});
    }

    const setShowWaterUsage = (showWaterUsage: boolean) => {
        updateClientSettings({showWaterUsage: showWaterUsage});
    }

    const setShowPhotonUsage = (showPhotonUsage: boolean) => {
        updateClientSettings({showPhotonUsage: showPhotonUsage});
    }

    const setShowUsernames = (showUsernames: boolean) => {
        updateClientSettings({showUsernames: showUsernames});
    }

    const setShowEmail = (showEmail: boolean) => {
        updateClientSettings({showEmail: showEmail});
    }

    let snapSize = clientSettings.snapSize ?? 20;
    snapSize = snapSize < 0 ? 0 : snapSize;
    snapSize = snapSize > 100 ? 100 : snapSize;
    snapSize = isNaN(snapSize) ? 0 : snapSize;

    return (
        <Modal show={show} onHide={handleClose} centered={true} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <h5>Minimap</h5>
                    <Form.Check type="checkbox" id={"check-minimap"} label="Enable minimap"
                                checked={clientSettings.minimapEnabled}
                                onChange={(e) => setMinimapEnabled(e.target.checked)}/>
                    <Form.Check disabled={!clientSettings.minimapEnabled} type="checkbox" id={"check-minimap_colors"}
                                label="Minimap colors" checked={clientSettings.minimapColors}
                                onChange={(e) => setMinimapColors(e.target.checked)}/>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Tooltips</h5>
                    <Form.Check type="checkbox" id={"check-tooltips"} label="Show tooltips"
                                checked={clientSettings.showToolTips}
                                onChange={(e) => setShowToolTips(e.target.checked)}/>
                    <Form.Label className="text-muted mb-0">Show tooltips on node handles and in the somersloop modal.</Form.Label>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <div className={"d-flex justify-content-between align-items-baseline"}>
                        <h5>Snapping</h5>
                        <span className={"text-body-tertiary"} style={{fontSize: ".9rem"}}>(20 recommended)</span>
                    </div>
                    <Form.Check type="checkbox" id={"check-snapping"} label="Enable snapping"
                                checked={clientSettings.snappingEnabled}
                                onChange={(e) => setSnappingEnabled(e.target.checked)}/>
                    <div className={"d-flex gap-2 align-items-center"}>
                        <div className={"col-2"}>
                            <Form.Control disabled={!clientSettings.snappingEnabled} id={"range-snapping"} min={0}
                                          max={100} value={snapSize}
                                          onChange={(e) => setSnapSize(parseInt(e.target.value))}/>
                        </div>
                        <Form.Range disabled={!clientSettings.snappingEnabled} id={"range-snapping"} min={0} max={100}
                                    value={snapSize} onChange={(e) => setSnapSize(parseInt(e.target.value))}/>
                    </div>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Side Panel</h5>
                    <Form.Check type="checkbox" id={"check-ionetto"} label="Enable input/output summing"
                                checked={clientSettings.enableIONetto}
                                onChange={(e) => setEnableIONetto(e.target.checked)}/>
                    <Form.Label className="text-muted mb-0">Sums I/O on sidepanel, to see total resource usage in a chart.</Form.Label>
                    <Form.Label className="text-muted">(i.e. if a node spawns 10 and another outputs 40, total out is 30).</Form.Label>
                </Form>


                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Overview</h5>
                    <Form.Check type="checkbox" id={"check-showWater"} label="Show water usage"
                                checked={clientSettings.showWaterUsage}
                                onChange={(e) => setShowWaterUsage(e.target.checked)}/>
                    <Form.Check type="checkbox" id={"check-showPhoton"} label="Show excited photonic matter usage"
                                checked={clientSettings.showPhotonUsage}
                                onChange={(e) => setShowPhotonUsage(e.target.checked)}/>
                </Form>

                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Privacy</h5>
                    <Form.Check type="checkbox" id={"check-showUsernames"} label="Show usernames"
                                checked={clientSettings.showUsernames}
                                onChange={(e) => setShowUsernames(e.target.checked)}/>
                    <Form.Check type="checkbox" id={"check-showEmail"} label="Show email addresses"
                                checked={clientSettings.showEmail}
                                onChange={(e) => setShowEmail(e.target.checked)}/>
                    <Form.Label className="text-muted">Turn these off when streaming or sharing your screen!</Form.Label>
                </Form>
            </Modal.Body>
        </Modal>
    );
}