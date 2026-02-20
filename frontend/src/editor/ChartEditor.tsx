import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {useCallback, useEffect, useRef, useState} from "react";
import * as Y from "yjs";
import {Background, BackgroundVariant, Controls, MiniMap, ReactFlow, useReactFlow,} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./ChartEditor.css";

import {useYjsSync} from "./hooks/useYjsSync.ts";
import {useNodeEdgeHandlers} from "./hooks/useNodeEdgeHandlers.ts";
import {useConnectionValidation} from "./hooks/useConnectionValidation.ts";
import {YjsContext} from "./context/YjsContext.tsx";
import {nodeTypes} from "./nodes";
import {edgeTypes} from "./edges";
import RecipeModal, {type RecipeModalProps} from "./components/modals/RecipeModal.tsx";
import {getRecipe} from "ficlib";
import {getItemIndexFromHandleId} from "./utils/idUtils.ts";
import {type PendingConnection, useNodeSpawner} from "./hooks/useNodeSpawner.ts";
import type {AppNode} from "./types.ts";

interface ChartEditorProps {
    projectId: string;
}

function ChartEditorInner({ projectId }: ChartEditorProps) {
    const auth = useAuth0Context();
    const reactFlow = useReactFlow();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        auth?.getAccessTokenSilently()?.then(setToken).catch(console.error);
    }, [auth]);

    const ydocRef = useRef<Y.Doc | null>(null);

    // ── Modal state ───────────────────────────────────────────────────────

    const [modalShow, setModalShow] = useState(false);
    const [modalRequiredInput,  setModalRequiredInput]  = useState<string | null>(null);
    const [modalRequiredOutput, setModalRequiredOutput] = useState<string | null>(null);

    // Holds either a pending drag-to-canvas connection, or null for a plain double-click spawn
    const pendingConnectionRef = useRef<PendingConnection | null>(null);
    const pendingPositionRef   = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // ── Node spawner ──────────────────────────────────────────────────────

    const { spawnNode } = useNodeSpawner(ydocRef);

    // ── Callback: drag released on empty canvas ───────────────────────────

    const onDropOnCanvas = useCallback(
        (pending: PendingConnection, position: { x: number; y: number }) => {
            const doc = ydocRef.current;
            if (!doc) return;

            // Determine which item is on the dragged handle so we can constrain the modal
            const node = doc.getMap("nodes").get(pending.nodeId) as AppNode;
            let itemClassName: string | null = null;

            if (node?.type === "recipe-node") {
                const recipe = getRecipe(node.data.recipeClassName);
                const idx = getItemIndexFromHandleId(pending.handleId);
                itemClassName = pending.handleType === "source"
                    ? recipe?.output[idx]?.name ?? null
                    : recipe?.input[idx]?.name ?? null;
            } else if (node?.type === "item-spawner-node") {
                itemClassName = node.data.itemClassName;
            } else if (node?.type === "end-node") {
                itemClassName = node.data.itemClassName;
            } else if (node?.type === "power-node") {
                const recipe = getRecipe(node.data.recipeClassName);
                const idx = getItemIndexFromHandleId(pending.handleId);
                itemClassName = recipe?.input[idx]?.name ?? null;
            } 

            pendingConnectionRef.current = pending;
            pendingPositionRef.current = position;

            // RequiredInput = we already have an output, so the new node needs to consume this item
            // RequiredOutput = we already have an input, so the new node needs to produce this item
            if (pending.handleType === "source") {
                setModalRequiredInput(itemClassName);
                setModalRequiredOutput(null);
            } else {
                setModalRequiredOutput(itemClassName);
                setModalRequiredInput(null);
            }

            setModalShow(true);
        },
        [ydocRef],
    );

    // ── Handlers ──────────────────────────────────────────────────────────
    
    const { nodes, setNodes, edges, setEdges, onNodesChangeInternal, onEdgesChangeInternal, onConnect, onConnectStart, onConnectEnd } =
        useNodeEdgeHandlers(ydocRef, onDropOnCanvas);

    const { isValidConnection } = useConnectionValidation();

    useYjsSync({ projectId, token, setNodes, setEdges, ydocRef });

    // ── Double-click to add a new recipe node ────────────────────────────
    
    const onDoubleClick = (event: React.MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.classList.contains("react-flow__pane")) return;
        
        const doc = ydocRef.current;
        if (!doc) return;
        
        const bounds = event.currentTarget.getBoundingClientRect();
        const mousePosition = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        pendingPositionRef.current = reactFlow.screenToFlowPosition(mousePosition);
        pendingConnectionRef.current = null;

        setModalRequiredInput(null);
        setModalRequiredOutput(null);
        
        setModalShow(true);
    };
    
    // ── Modal submit ──────────────────────────────────────────────────────

    const onModalSubmit = useCallback<RecipeModalProps["onModalSubmit"]>(
        (type, className) => {
            setModalShow(false);
            if (type === "none" || className === null) return;

            // Offset so the node doesn't land exactly on the cursor
            const nodeTypeOffset = type === "recipe" ? 150 : 120;
            const base = pendingPositionRef.current;
            const pending = pendingConnectionRef.current;

            // When dragging from an input (target handle), the new node goes above
            const y = (pending?.handleType === "target") ? base.y - nodeTypeOffset : base.y;
            const position = { x: base.x, y };

            spawnNode(type, className, position, pending);

            pendingConnectionRef.current = null;
        },
        [spawnNode],
    );

    return (
        // Provide the Y.Doc ref to every node and edge component via context
        <YjsContext.Provider value={ydocRef}>
            <div style={{ width: "100%", height: "100vh" }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChangeInternal}
                    onEdgesChange={onEdgesChangeInternal}
                    onConnect={onConnect}
                    onConnectStart={onConnectStart}
                    onConnectEnd={onConnectEnd}
                    isValidConnection={isValidConnection}
                    onDoubleClickCapture={onDoubleClick}
                    zoomOnDoubleClick={false}
                    nodeOrigin={[0.5, 0.0]}
                    fitView
                >
                    <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
                    <Controls />
                    <MiniMap />
                </ReactFlow>

                <RecipeModal
                    show={modalShow}
                    onModalSubmit={onModalSubmit}
                    RequiredInput={modalRequiredInput}
                    RequiredOutput={modalRequiredOutput}
                />
            </div>
        </YjsContext.Provider>
    );
}

export default function ChartEditor(props: ChartEditorProps) {
    return <ChartEditorInner {...props} />;
}