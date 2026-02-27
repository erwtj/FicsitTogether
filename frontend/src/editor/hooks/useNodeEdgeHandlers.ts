import { useCallback, useRef } from "react";
import * as Y from "yjs";
import {
    type Node, type Edge,
    type NodeChange, type EdgeChange, type Connection,
    useNodesState, useEdgesState, useReactFlow,
    type OnConnectStart
} from "@xyflow/react";
import { getRecipe } from "ficlib";
import { computeNodeFactor } from "../utils/factoryCalc";
import { type RecipeNodeData, type ItemSpawnerNodeData, type ItemEdgeData } from "../types";
import {getItemIndexFromHandleId} from "../utils/idUtils.ts";
import type {PendingConnection} from "./useNodeSpawner.ts";

const LOCAL_ORIGIN = "local";

// ─── Throughput helpers ───────────────────────────────────────────────────────

/**
 * Total throughput already flowing out of `handleId` on the source node.
 */
function usedSourceThroughput(edges: Edge<ItemEdgeData>[], sourceId: string, handleId: string): number {
    return edges
        .filter(e => e.source === sourceId && e.sourceHandle === handleId)
        .reduce((sum, e) => sum + (e.data?.throughput ?? 0), 0);
}

/**
 * Total throughput already flowing into `handleId` on the target node.
 */
function usedTargetThroughput(edges: Edge<ItemEdgeData>[], targetId: string, handleId: string): number {
    return edges
        .filter(e => e.target === targetId && e.targetHandle === handleId)
        .reduce((sum, e) => sum + (e.data?.throughput ?? 0), 0);
}

/**
 * Maximum throughput available from a source handle (items/min, raw units).
 * Returns null if the node/handle is unknown.
 */
function maxSourceThroughput(
    sourceNode: Node,
    sourceHandle: string,
    allEdges: Edge<ItemEdgeData>[],
): number | null {
    const handleIdx = getItemIndexFromHandleId(sourceHandle);

    if (sourceNode.type === "item-spawner-node") {
        const d = sourceNode.data as ItemSpawnerNodeData;
        // outputAmount is already in raw units (mL/min or items/min)
        return d.outputAmount;
    }

    if (sourceNode.type === "recipe-node") {
        const d = sourceNode.data as RecipeNodeData;
        const recipe = getRecipe(d.recipeClassName);
        if (!recipe) return null;

        const incomingEdges = allEdges.filter(e => e.target === sourceNode.id);
        const outgoingEdges  = allEdges.filter(e => e.source === sourceNode.id);
        const factor = computeNodeFactor(recipe, d.summerSloops, d.percentage, incomingEdges, outgoingEdges);

        const output = recipe.output[handleIdx];
        if (!output) return null;
        return output.amount * (60 / recipe.duration) * factor.outputFactor;
    }

    return null;
}

/**
 * Maximum throughput required by a target handle (items/min, raw units).
 * Returns null if the node/handle is unknown.
 */
function maxTargetThroughput(
    targetNode: Node,
    targetHandle: string,
    allEdges: Edge<ItemEdgeData>[],
): number | null {
    if (targetNode.type !== "recipe-node") return null;  // end-node / power-node accept anything

    const handleIdx = getItemIndexFromHandleId(targetHandle);
    const d = targetNode.data as RecipeNodeData;
    const recipe = getRecipe(d.recipeClassName);
    if (!recipe) return null;

    const incomingEdges = allEdges.filter(e => e.target === targetNode.id);
    const outgoingEdges  = allEdges.filter(e => e.source === targetNode.id);
    const factor = computeNodeFactor(recipe, d.summerSloops, d.percentage, incomingEdges, outgoingEdges);

    const input = recipe.input[handleIdx];
    if (!input) return null;
    return input.amount * (60 / recipe.duration) * factor.inputFactor;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type ConnectingInfo = {
    nodeId: string;
    handleId: string;
    handleType: "source" | "target";
};

export function useNodeEdgeHandlers(
    ydocRef: React.RefObject<Y.Doc | null>,
    onDropOnCanvas: (pending: PendingConnection, position: { x: number; y: number }) => void,
) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const reactFlow = useReactFlow();

    const connectingInfo = useRef<ConnectingInfo | null>(null);

    // ── onConnectStart ────────────────────────────────────────────────────

    const onConnectStart = useCallback<OnConnectStart>(
        (_, { nodeId, handleId, handleType }) => {
            if (nodeId && handleId && handleType) {
                connectingInfo.current = { nodeId, handleId, handleType };
            }
        },
        [],
    );

    // ── onConnectEnd ──────────────────────────────────────────────────────

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const info = connectingInfo.current;
            connectingInfo.current = null;
            if (!info) return;

            // Only act when dropped on the empty canvas pane
            const target = event.target as HTMLElement;
            if (!target.classList.contains("react-flow__pane")) return;

            const clientX = "clientX" in event ? event.clientX : event.touches[0].clientX;
            const clientY = "clientY" in event ? event.clientY : event.touches[0].clientY;
            const position = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });

            const allEdges = reactFlow.getEdges() as Edge<ItemEdgeData>[];
            const node = reactFlow.getNode(info.nodeId);
            if (!node) return;

            // Pre-compute throughput so the spawned edge is ready immediately
            let throughput = 0;
            if (info.handleType === "source") {
                const max = maxSourceThroughput(node, info.handleId, allEdges);
                if (max !== null) {
                    const used = usedSourceThroughput(allEdges, info.nodeId, info.handleId);
                    throughput = Math.max(0, max - used);
                }
            } else {
                const max = maxTargetThroughput(node, info.handleId, allEdges);
                if (max !== null) {
                    const used = usedTargetThroughput(allEdges, info.nodeId, info.handleId);
                    throughput = Math.max(0, max - used);
                }
            }

            onDropOnCanvas({ nodeId: info.nodeId, handleId: info.handleId, handleType: info.handleType, throughput }, position);
        },
        [reactFlow, onDropOnCanvas],
    );

    // Buffered positions for deferred Yjs writes: map of nodeId → latest position
    const pendingPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    // ── Node changes ──────────────────────────────────────────────────────

    const onNodesChangeInternal = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        // Separate position changes (buffered) from structural changes (immediate)
        const structural: NodeChange[] = [];
        changes.forEach((change) => {
            if (change.type === "position") {
                if (change.position) {
                    pendingPositions.current.set(change.id, change.position);
                }
                // On drag-end (dragging === false), flush all buffered positions
                if (change.dragging === false) {
                    doc.transact(() => {
                        const nodeMap = doc.getMap<Node>("nodes");
                        pendingPositions.current.forEach((pos, id) => {
                            const node = nodeMap.get(id);
                            if (node) nodeMap.set(id, { ...node, position: pos });
                        });
                        pendingPositions.current.clear();
                    }, LOCAL_ORIGIN);
                }
            } else {
                structural.push(change);
            }
        });

        if (structural.length === 0) return;

        doc.transact(() => {
            const nodeMap = doc.getMap<Node>("nodes");
            structural.forEach((change) => {
                if (change.type === "remove" && nodeMap.has(change.id)) {
                    nodeMap.delete(change.id);
                } else if (change.type === "add") {
                    nodeMap.set(change.item.id, change.item);
                } else if (change.type === "dimensions") {
                    const node = nodeMap.get(change.id);
                    if (node) {
                        nodeMap.set(change.id, {
                            ...node,
                            width:  change.dimensions?.width  ?? node.width,
                            height: change.dimensions?.height ?? node.height,
                        });
                    }
                }
            });
        }, LOCAL_ORIGIN);
    }, [onNodesChange, ydocRef]);

    // ── Edge changes ──────────────────────────────────────────────────────

    const onEdgesChangeInternal = useCallback((changes: EdgeChange[]) => {
        onEdgesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        doc.transact(() => {
            const edgeMap = doc.getMap<Edge>("edges");
            changes.forEach((change) => {
                if (change.type === "add") {
                    edgeMap.set(change.item.id, change.item);
                } else if (change.type === "remove") {
                    edgeMap.delete(change.id);
                } else if (change.type === "select") {
                    const edge = edgeMap.get(change.id);
                    if (edge) edgeMap.set(change.id, { ...edge, selected: change.selected });
                }
            });
        }, LOCAL_ORIGIN);
    }, [onEdgesChange, ydocRef]);

    // ── Connect ───────────────────────────────────────────────────────────

    const onConnect = useCallback((connection: Connection) => {
        const doc = ydocRef.current;
        if (!doc) return;

        const { source, target, sourceHandle, targetHandle } = connection;
        if (!source || !target || !sourceHandle || !targetHandle) return;

        const sourceNode = reactFlow.getNode(source);
        const targetNode = reactFlow.getNode(target);
        if (!sourceNode || !targetNode) return;

        const allEdges = reactFlow.getEdges() as Edge<ItemEdgeData>[];

        // ── Compute throughput based on drag direction ──────────────────
        let throughput = 0;
        const info = connectingInfo.current;

        if (!info || info.handleType === "source") {
            // Dragged from an output handle → fill with remaining output capacity
            const max = maxSourceThroughput(sourceNode, sourceHandle, allEdges);
            if (max !== null) {
                const used = usedSourceThroughput(allEdges, source, sourceHandle);
                throughput = Math.max(0, max - used);
            }
        } else {
            // Dragged from an input handle → fill with remaining input demand
            const max = maxTargetThroughput(targetNode, targetHandle, allEdges);
            if (max !== null) {
                const used = usedTargetThroughput(allEdges, target, targetHandle);
                throughput = Math.max(0, max - used);
            }
        }

        const newEdge: Edge<ItemEdgeData> = {
            id: `edge-${Date.now()}`,
            type: "item-edge",
            source,
            target,
            sourceHandle,
            targetHandle,
            data: { throughput },
        };

        doc.getMap<Edge>("edges").set(newEdge.id, newEdge);
        connectingInfo.current = null;
    }, [ydocRef, reactFlow]);

    return {
        nodes, setNodes,
        edges, setEdges,
        onNodesChangeInternal,
        onEdgesChangeInternal,
        onConnect,
        onConnectStart,
        onConnectEnd
    };
}