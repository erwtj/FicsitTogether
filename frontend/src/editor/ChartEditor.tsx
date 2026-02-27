import {useCallback, useEffect, useRef, useState } from "react";
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
import { useNodeModal } from "./hooks/useNodeModal.ts";
import type { Edge, NodeChange } from "@xyflow/react";
import {OverviewSidePanel} from "./components/panels/OverviewSidePanel.tsx";

interface ChartEditorProps {
    projectId: string;
}

function ChartEditorInner({ projectId }: ChartEditorProps) {
    const auth = useAuth0Context();
    const ydocRef = useRef<Y.Doc | null>(null);

    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        auth?.getAccessTokenSilently()?.then(setToken).catch(console.error);
    }, [auth]);

    // Add node modal stuff (spawn, auto-connect logic, etc.)
    const { show, requiredInput, requiredOutput, onDropOnCanvas, onCanvasDoubleClick, onModalSubmit } =
        useNodeModal(ydocRef);

    // Manage node, edge state and handlers + send to useFactorySync and useYjsSync
    const { nodes, setNodes, edges, setEdges, onNodesChangeInternal, onEdgesChangeInternal, onConnect, onConnectStart, onConnectEnd } =
        useNodeEdgeHandlers(ydocRef, onDropOnCanvas);

    // Calculates stuff that can be inferred from edge and node states
    // (e.g. building count and overused outputs)
    // Pushes it into node data for easy access by nodes so not every node has to calculate it all over again which is laggy as hell
    // So anything that can be derived from just the graph structure and edge throughput should go in this hook to minimize expensive calculations and re-renders in nodes
    useFactorySync(edges as Edge<ItemEdgeData>[], nodes);

    // Sync document using Yjs
    useYjsSync({ projectId, token, setNodes, setEdges, ydocRef });

    // Connection validation
    const { isValidConnection } = useConnectionValidation();

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
                    style={{outline: "none"}}
                    tabIndex={-1}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={{ style: { strokeWidth: 1.75 } }}
                    onNodesChange={onNodesChangeInternal}
                    onEdgesChange={onEdgesChangeInternal}
                    onConnect={onConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    isValidConnection={isValidConnection}
                    onDoubleClickCapture={onCanvasDoubleClick}
                    zoomOnDoubleClick={false}
                    nodeOrigin={[0.5, 0.0]}
                    deleteKeyCode={['Backspace', 'Delete']}
                    multiSelectionKeyCode={'Shift'}
                    onKeyDownCapture={handleKeyDownCapture}
                    fitView
                >
                    <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
                    <MiniMap className="bg-body" position="top-right" nodeColor={nodeColor} />
                    <Panel position={"top-left"} className={"h-100"} style={{placeContent: "center"}}>
                        <OverviewSidePanel/>
                    </Panel>
                </ReactFlow>

                <RecipeModal
                    show={show}
                    onModalSubmit={onModalSubmit}
                    RequiredInput={requiredInput}
                    RequiredOutput={requiredOutput}
                />
            </div>
        </YjsContext.Provider>
    );
}

export default function ChartEditor(props: ChartEditorProps) {
    return <ChartEditorInner {...props} />;
}