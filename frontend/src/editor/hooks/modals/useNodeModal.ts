import { useCallback, useRef, useState } from "react";
import * as Y from "yjs";
import { useReactFlow } from "@xyflow/react";
import { getRecipe } from "ficlib";
import { type AppNode } from "../../types.ts";
import { getItemIndexFromHandleId } from "../../utils/idUtils.ts";
import { type PendingConnection, useNodeSpawner } from "../useNodeSpawner.ts";
import type { RecipeModalProps } from "../../components/modals/RecipeModal.tsx";

/**
 * Manages the recipe-picker modal: when to show it, what item constraints to
 * pass to it, and what to do when the user confirms a selection.
 *
 * Handles both:
 *  - Double-click on the canvas (plain node spawn)
 *  - Drag-to-empty-canvas from a handle (spawn + auto-connect)
 */
export function useNodeModal(ydocRef: React.RefObject<Y.Doc | null>) {
    const reactFlow = useReactFlow();
    const { spawnNode } = useNodeSpawner(ydocRef);

    const [show, setShow] = useState(false);
    const [requiredInput, setRequiredInput] = useState<string | null>(null);
    const [requiredOutput, setRequiredOutput] = useState<string | null>(null);

    const pendingConnectionRef = useRef<PendingConnection | null>(null);
    const pendingPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    /** Called by ChartEditor when the user drops a connection on the empty canvas. */
    const onDropOnCanvas = useCallback(
        (pending: PendingConnection, position: { x: number; y: number }) => {
            const doc = ydocRef.current;
            if (!doc) return;

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

            if (pending.handleType === "source") {
                setRequiredInput(itemClassName);
                setRequiredOutput(null);
            } else {
                setRequiredOutput(itemClassName);
                setRequiredInput(null);
            }
            setShow(true);
        },
        [ydocRef],
    );

    /** Called when the user double-clicks the empty canvas. */
    const onCanvasDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.classList.contains("react-flow__pane")) return;

            const bounds = event.currentTarget.getBoundingClientRect();
            pendingPositionRef.current = reactFlow.screenToFlowPosition({
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            });
            pendingConnectionRef.current = null;
            setRequiredInput(null);
            setRequiredOutput(null);
            setShow(true);
        },
        [reactFlow],
    );

    /** Called when the modal resolves with a type + className. */
    const onModalSubmit = useCallback<RecipeModalProps["onModalSubmit"]>(
        (type, className) => {
            setShow(false);
            if (type === "none" || className === null) return;

            const nodeTypeOffset = type === "recipe" ? 150 : 120;
            const base = pendingPositionRef.current;
            const pending = pendingConnectionRef.current;

            const y = pending?.handleType === "target" ? base.y - nodeTypeOffset : base.y;

            spawnNode(type, className, { x: base.x, y }, pending);
            pendingConnectionRef.current = null;
        },
        [spawnNode],
    );

    return {
        show,
        requiredInput,
        requiredOutput,
        onDropOnCanvas,
        onCanvasDoubleClick,
        onModalSubmit,
    };
}

