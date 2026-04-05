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
                    <h5>Editor overlays</h5>
                    <Form.Check type="checkbox" id={"check-minimap"} label="Enable minimap"
                                checked={clientSettings.minimapEnabled}
                                onChange={(e) => updateClientSettings({minimapEnabled: e.target.checked})}/>
                    <Form.Check disabled={!clientSettings.minimapEnabled} type="checkbox" id={"check-minimap_colors"}
                                label="Minimap colors" checked={clientSettings.minimapColors}
                                onChange={(e) => updateClientSettings({minimapColors: e.target.checked})}/>
                    <Form.Check type="checkbox" id={"check-showControls"} label="Show controls"
                                checked={clientSettings.showControls}
                                onChange={(e) => updateClientSettings({showControls: e.target.checked})}/>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Throughput</h5>
                    <Form.Check type="checkbox" id={"check-autoBackPropagation"} label="Auto-fix upstream values"
                                checked={clientSettings.autoBackPropagation}
                                onChange={(e) => updateClientSettings({autoBackPropagation: e.target.checked})}/>
                    <Form.Label className="text-muted mb-0">When changing an edge throughput, automatically updates upstream requirements instead of only marking overuse.</Form.Label>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Tooltips</h5>
                    <Form.Check type="checkbox" id={"check-tooltips"} label="Show tooltips"
                                checked={clientSettings.showToolTips}
                                onChange={(e) => updateClientSettings({showToolTips: e.target.checked})}/>
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
                                onChange={(e) => updateClientSettings({snappingEnabled: e.target.checked})}/>
                    <div className={"d-flex gap-2 align-items-center"}>
                        <div className={"col-2"}>
                            <Form.Control disabled={!clientSettings.snappingEnabled} id={"range-snapping"} min={0}
                                          max={100} value={snapSize}
                                          onChange={(e) => updateClientSettings({snapSize: parseInt(e.target.value)})}/>
                        </div>
                        <Form.Range disabled={!clientSettings.snappingEnabled} id={"range-snapping"} min={0} max={100}
                                    value={snapSize} onChange={(e) => updateClientSettings({snapSize: parseInt(e.target.value)})}/>
                    </div>
                </Form>
                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Side Panel</h5>
                    <Form.Check type="checkbox" id={"check-ionetto"} label="Enable input/output summing"
                                checked={clientSettings.enableIONetto}
                                onChange={(e) => updateClientSettings({enableIONetto: e.target.checked})}/>
                    <Form.Label className="text-muted mb-0">Sums I/O on sidepanel, to see total resource usage in a chart.</Form.Label>
                    <Form.Label className="text-muted">(i.e. if a node spawns 10 and another outputs 40, total out is 30).</Form.Label>
                </Form>


                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Overview</h5>
                    <Form.Check type="checkbox" id={"check-showWater"} label="Show water usage"
                                checked={clientSettings.showWaterUsage}
                                onChange={(e) => updateClientSettings({showWaterUsage: e.target.checked})}/>
                    <Form.Check type="checkbox" id={"check-showPhoton"} label="Show excited photonic matter usage"
                                checked={clientSettings.showPhotonUsage}
                                onChange={(e) => updateClientSettings({showPhotonUsage: e.target.checked})}/>
                </Form>

                <hr/>
                <Form onSubmit={handleSubmit}>
                    <h5>Privacy</h5>
                    <Form.Check type="checkbox" id={"check-showUsernames"} label="Show usernames"
                                checked={clientSettings.showUsernames}
                                onChange={(e) => updateClientSettings({showUsernames: e.target.checked})}/>
                    <Form.Check type="checkbox" id={"check-showEmail"} label="Show email addresses"
                                checked={clientSettings.showEmail}
                                onChange={(e) => updateClientSettings({showEmail: e.target.checked})}/>
                    <Form.Label className="text-muted">Turn these off when streaming or sharing your screen!</Form.Label>
                </Form>
            </Modal.Body>
        </Modal>
    );
}