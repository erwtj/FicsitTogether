import { useCallback, useRef } from "react";
import * as Y from "yjs";
import {
    type Node, type Edge,
    type NodeChange, type EdgeChange, type Connection,
    useNodesState, useEdgesState, useReactFlow,
    type OnConnectStart,
} from "@xyflow/react";
import { type ItemEdgeData } from "../types";
import {
    maxSourceThroughput, maxTargetThroughput,
    usedSourceThroughput, usedTargetThroughput,
} from "../utils/throughput";
import type { PendingConnection } from "./useNodeSpawner";
import { stripComputedFields } from "../utils/idUtils";
import { generateEdgeId } from "../utils/idUtils";

const LOCAL_ORIGIN = "local";

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
    const pendingPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    // ── Connect start / end (drag-to-canvas spawning) ─────────────────────

    const onConnectStart = useCallback<OnConnectStart>(
        (_, { nodeId, handleId, handleType }) => {
            if (nodeId && handleId && handleType) {
                connectingInfo.current = { nodeId, handleId, handleType };
            }
        },
        [],
    );

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const info = connectingInfo.current;
            connectingInfo.current = null;
            if (!info) return;

            const target = event.target as HTMLElement;
            if (!target.classList.contains("react-flow__pane")) return;

            const clientX = "clientX" in event ? event.clientX : event.touches[0].clientX;
            const clientY = "clientY" in event ? event.clientY : event.touches[0].clientY;
            const position = reactFlow.screenToFlowPosition({ x: clientX, y: clientY });

            const allEdges = reactFlow.getEdges() as Edge<ItemEdgeData>[];
            const node = reactFlow.getNode(info.nodeId);
            if (!node) return;

            let throughput = 0;
            if (info.handleType === "source") {
                const max = maxSourceThroughput(node, info.handleId, allEdges);
                if (max !== null)
                    throughput = Math.max(0, max - usedSourceThroughput(allEdges, info.nodeId, info.handleId));
            } else {
                const max = maxTargetThroughput(node, info.handleId, allEdges);
                if (max !== null)
                    throughput = Math.max(0, max - usedTargetThroughput(allEdges, info.nodeId, info.handleId));
            }

            onDropOnCanvas(
                { nodeId: info.nodeId, handleId: info.handleId, handleType: info.handleType, throughput },
                position,
            );
        },
        [reactFlow, onDropOnCanvas],
    );

    // ── Node changes — defer position writes to Yjs until drag-end ────────

    const onNodesChangeInternal = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        const structural: NodeChange[] = [];
        for (const change of changes) {
            if (change.type === "position") {
                if (change.position) pendingPositions.current.set(change.id, change.position);
                if (change.dragging === false) {
                    doc.transact(() => {
                        const nodeMap = doc.getMap<Node>("nodes");
                        pendingPositions.current.forEach((pos, id) => {
                            const n = nodeMap.get(id);
                            if (n) nodeMap.set(id, stripComputedFields({ ...n, position: pos }));
                        });
                        pendingPositions.current.clear();
                    }, LOCAL_ORIGIN);
                }
            } else {
                structural.push(change);
            }
        }

        if (structural.length === 0) return;
        doc.transact(() => {
            const nodeMap = doc.getMap<Node>("nodes");
            for (const change of structural) {
                if (change.type === "remove" && nodeMap.has(change.id)) {
                    nodeMap.delete(change.id);
                } else if (change.type === "add") {
                    nodeMap.set(change.item.id, stripComputedFields(change.item));
                } else if (change.type === "dimensions") {
                    const n = nodeMap.get(change.id);
                    if (n) nodeMap.set(change.id, {
                        ...n,
                        width: change.dimensions?.width ?? n.width,
                        height: change.dimensions?.height ?? n.height,
                    });
                }
            }
        }, LOCAL_ORIGIN);
    }, [onNodesChange, ydocRef]);

    // ── Edge changes ──────────────────────────────────────────────────────

    const onEdgesChangeInternal = useCallback((changes: EdgeChange[]) => {
        onEdgesChange(changes);
        const doc = ydocRef.current;
        if (!doc) return;

        doc.transact(() => {
            const edgeMap = doc.getMap<Edge>("edges");
            for (const change of changes) {
                if (change.type === "add") {
                    edgeMap.set(change.item.id, change.item);
                } else if (change.type === "remove") {
                    edgeMap.delete(change.id);
                }
            }
        }, LOCAL_ORIGIN);
    }, [onEdgesChange, ydocRef]);

    // ── Connect (drop on existing handle) ────────────────────────────────

    const onConnect = useCallback((connection: Connection) => {
        const doc = ydocRef.current;
        if (!doc) return;

        const { source, target, sourceHandle, targetHandle } = connection;
        if (!source || !target || !sourceHandle || !targetHandle) return;

        const sourceNode = reactFlow.getNode(source);
        const targetNode = reactFlow.getNode(target);
        if (!sourceNode || !targetNode) return;

        const allEdges = reactFlow.getEdges() as Edge<ItemEdgeData>[];
        const info = connectingInfo.current;

        let throughput = 0;
        if (!info || info.handleType === "source") {
            const max = maxSourceThroughput(sourceNode, sourceHandle, allEdges);
            if (max !== null)
                throughput = Math.max(0, max - usedSourceThroughput(allEdges, source, sourceHandle));
        } else {
            const max = maxTargetThroughput(targetNode, targetHandle, allEdges);
            if (max !== null)
                throughput = Math.max(0, max - usedTargetThroughput(allEdges, target, targetHandle));
        }

        const edgeId = generateEdgeId();
        doc.getMap<Edge>("edges").set(edgeId, {
            id: edgeId,
            type: "item-edge",
            source, target, sourceHandle, targetHandle,
            data: { throughput },
        });
        connectingInfo.current = null;
    }, [ydocRef, reactFlow]);

    return {
        nodes, setNodes,
        edges, setEdges,
        onNodesChangeInternal,
        onEdgesChangeInternal,
        onConnect,
        onConnectStart,
        onConnectEnd,
    };
}
