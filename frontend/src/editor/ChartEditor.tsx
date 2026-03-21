import {useCallback, useMemo, useRef } from "react";
import * as Y from "yjs";
import { Background, BackgroundVariant, MiniMap, Panel, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./ChartEditor.css";

import { useAuth0Context } from "../auth/useAuth0Context.ts";
import { YjsContext } from "./context/YjsContext.tsx";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { nodeColor, type ItemEdgeData } from "./types.ts";
import RecipeModal from "./components/modals/RecipeModal.tsx";

import { useNodeEdgeHandlers } from "./hooks/useNodeEdgeHandlers.ts";
import { useConnectionValidation } from "./hooks/useConnectionValidation.ts";
import { useFactorySync } from "./hooks/useFactorySync.ts";
import { useYjsSync } from "./hooks/useYjsSync.ts";
import { useNodeModal } from "./hooks/modals/useNodeModal.ts";
import type { Edge, NodeChange } from "@xyflow/react";
import {OverviewSidePanel} from "./components/panels/OverviewSidePanel.tsx";
import { Toast } from "react-bootstrap";
import {useSloopModal} from "./hooks/modals/useSloopModal.ts";
import {SloopModal} from "./components/modals/SloopModal.tsx";
import {useClientSettings} from "../hooks/useClientSettings.ts";

// Static constants to prevent recreation on every render
const reactFlowStyle = { outline: "none" };
const panelStyle = { placeContent: "center" as const };
const defaultEdgeOptions = { style: { strokeWidth: 1.75 } };
const deleteKeyCodes: string[] = ['Backspace', 'Delete'];
const multiSelectionKeyCodes: string[] = ['Shift', 'Control'];

interface ChartEditorProps {
    projectId: string;
}

function ChartEditorInner({ projectId }: ChartEditorProps) {
    const auth = useAuth0Context();
    const ydocRef = useRef<Y.Doc | null>(null);

    const getAccessToken = useCallback(async () => {
        return auth?.getAccessTokenSilently() ?? null;
    }, [auth]);

    const {clientSettings} = useClientSettings();

    // Add node modal stuff (spawn, auto-connect logic, etc.)
    const { show, requiredInput, requiredOutput, onDropOnCanvas, onCanvasDoubleClick, onModalSubmit } =
        useNodeModal(ydocRef);

    // Add sloop modal
    const { show: showSloop, details: sloopDetails, onModalSubmit: onSloopModalSubmit } = useSloopModal();

    // Manage node, edge state and handlers + send to useFactorySync and useYjsSync
    const { nodes, setNodes, edges, setEdges, onNodesChangeInternal, onEdgesChangeInternal, onConnect, onConnectStart, onConnectEnd } =
        useNodeEdgeHandlers(ydocRef, onDropOnCanvas);

    // Calculates stuff that can be inferred from edge and node states
    // (e.g. building count and overused outputs)
    // Pushes it into node data for easy access by nodes so not every node has to calculate it all over again which is laggy as hell
    // So anything that can be derived from just the graph structure and edge throughput should go in this hook to minimize expensive calculations and re-renders in nodes
    useFactorySync(edges as Edge<ItemEdgeData>[], nodes);

    // Sync document using Yjs
    const {connected} = useYjsSync({ projectId, getAccessToken, setNodes, setEdges, ydocRef });

    // Connection validation
    const { isValidConnection } = useConnectionValidation();

    // Memoize snap grid to prevent array recreation
    const snapGrid = useMemo(
        () => [clientSettings.snapSize, clientSettings.snapSize] as [number, number],
        [clientSettings.snapSize]
    );

    // Memoize node color function for MiniMap
    const nodeColorMemo = useMemo(
        () => clientSettings.minimapColors ? nodeColor : undefined,
        [clientSettings.minimapColors]
    );

    const handleKeyDownCapture = useCallback((event: React.KeyboardEvent) => {
        // Ignore text inputs
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

        if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            const selectChanges: NodeChange[] = [];

            for (const node of nodes) {
                selectChanges.push({
                    type: "select",
                    selected: true,
                    id: node.id
                });
            }

            onNodesChangeInternal(selectChanges);
        }
    }, [nodes, onNodesChangeInternal]);

    return (
        <YjsContext.Provider value={ydocRef}>
            <div style={{ width: "100%", height: "100vh" }}>
                <ReactFlow
                    style={reactFlowStyle}
                    tabIndex={-1}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    onNodesChange={onNodesChangeInternal}
                    onEdgesChange={onEdgesChangeInternal}
                    onConnect={onConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    isValidConnection={isValidConnection}
                    onDoubleClickCapture={onCanvasDoubleClick}
                    zoomOnDoubleClick={false}
                    nodeOrigin={[0.5, 0.0]}
                    deleteKeyCode={deleteKeyCodes}
                    multiSelectionKeyCode={multiSelectionKeyCodes}
                    onKeyDownCapture={handleKeyDownCapture}
                    fitView
                    snapToGrid={clientSettings.snappingEnabled}
                    snapGrid={snapGrid}
                >
                    <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
                    {clientSettings.minimapEnabled && <MiniMap className="bg-body" position="top-right" nodeColor={nodeColorMemo} />}
                    <Panel position={"top-left"} className={"h-100"} style={panelStyle}>
                        <OverviewSidePanel projectId={projectId}/>
                    </Panel>
                </ReactFlow>

                <div className="experimental-ribbon no-drag">
                    Experimental
                </div>
                
                <div className="position-fixed top-0 end-0 p-3 z-1">
                    <Toast show={!connected} className="delayed-appear">
                        <Toast.Header closeButton={false}>
                            <strong className={"text-warning me-auto"}>Warning</strong>
                        </Toast.Header>
                        <Toast.Body>
                            Connection to server lost, please refresh the page!
                            Any changes made without a connection will be lost.
                        </Toast.Body>
                    </Toast>
                </div>
                
                <RecipeModal
                    key={`${show}-${requiredOutput}`}
                    show={show}
                    onModalSubmit={onModalSubmit}
                    RequiredInput={requiredInput}
                    RequiredOutput={requiredOutput}
                />
                <SloopModal
                    key={`${showSloop}-${sloopDetails?.nodeId}`}
                    show={showSloop}
                    nodeId={sloopDetails?.nodeId ?? ""}
                    onModalClose={onSloopModalSubmit}
                />
            </div>
        </YjsContext.Provider>
    );
}

export default function ChartEditor(props: ChartEditorProps) {
    return (
        <ChartEditorInner {...props} />
    );
}