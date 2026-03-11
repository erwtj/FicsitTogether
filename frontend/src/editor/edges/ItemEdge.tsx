import { memo, useCallback, useMemo, useState } from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    useReactFlow,
} from "@xyflow/react";
import { getItem, getRecipe } from "ficlib";
import { type Item } from "ficlib";
import { isItemSolid, roundTo3Decimals } from "../../utils/throughputUtil.ts";
import { MAX_MOVABLE_POINTS } from "dtolib";
import { useYjsMutation } from "../hooks/useYjsMutation";
import {
    type ItemEdgeType,
    type RecipeNodeData,
    type ItemSpawnerNodeData,
    type MovablePoint,
} from "../types";
import { getCustomBezierCurve } from "../utils/edgeUtils.ts";
import "./ItemEdge.css";
import { getItemIndexFromHandleId } from "../utils/idUtils.ts";
import { Plus } from "react-bootstrap-icons";

export const ItemEdge = memo(function ItemEdge({
    id,
    source,
    target,
    sourceHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    markerEnd,
    style,
}: EdgeProps<ItemEdgeType>) {
    const { updateEdgeData } = useYjsMutation();
    const reactFlow = useReactFlow();

    // During a drag we buffer intermediate positions in local state so the SVG
    const [dragBuffer, setDragBuffer] = useState<MovablePoint[] | null>(null);

    // The effective movable points: drag buffer while dragging, data prop otherwise.
    const movablePoints: MovablePoint[] = useMemo(
        () => dragBuffer ?? (data?.movablePoints ?? []),
        [dragBuffer, data?.movablePoints],
    );


    sourceY = sourceY - 10; // Nudge source handle up by 10px to align with item icon center
    targetY = targetY + 10; // Nudge target handle up by 10px to align with item icon center

    const [basePath, baseLabelX, baseLabelY] = getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
    });

    const sourceNode = reactFlow.getNode(source);
    const targetNode = reactFlow.getNode(target);

    const sourceItem: Item | null = useMemo(() => {
        if (!sourceNode) return null;
        if (sourceNode.type === "recipe-node") {
            const rd = sourceNode.data as RecipeNodeData;
            const recipe = getRecipe(rd.recipeClassName);
            const idx = getItemIndexFromHandleId(sourceHandleId ?? "");
            return getItem(recipe?.output[idx]?.name ?? "") ?? null;
        }
        if (sourceNode.type === "item-spawner-node") {
            const sd = sourceNode.data as ItemSpawnerNodeData;
            return getItem(sd.itemClassName) ?? null;
        }
        return null;
    }, [sourceNode, sourceHandleId]);

    const isFluid = sourceItem ? !isItemSolid(sourceItem) : false;


    // ── Over-capacity check ────────────────────────────────────────────────
    // Read the pre-computed flag from the source node's data (set by useFactorySync).
    // Works for both recipe-node and item-spawner-node sources.
    const outputTooHigh = useMemo(() => {
        if (!sourceNode || !sourceHandleId) return false;
        if (sourceNode.type === "recipe-node") {
            const d = sourceNode.data as RecipeNodeData;
            return d._outputOverUsed?.[sourceHandleId] ?? false;
        }
        if (sourceNode.type === "item-spawner-node") {
            const d = sourceNode.data as ItemSpawnerNodeData;
            return d._outputOverUsed?.[sourceHandleId] ?? false;
        }
        return false;
    }, [sourceNode, sourceHandleId]);

    // ── Throughput input ───────────────────────────────────────────────────
    const throughput = data?.throughput ?? 0;
    const divisor = isFluid ? 1000 : 1;
    const displayAmount = throughput === 0 ? "" : roundTo3Decimals(throughput / divisor).toString();

    const handleThroughputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0) {
                updateEdgeData(id, { throughput: 0 });
                return;
            }
            updateEdgeData(id, { throughput: isFluid ? val * 1000 : val });
        },
        [id, isFluid, updateEdgeData],
    );

    const fluidColor = isFluid && sourceItem?.fluidColor
        ? `#${sourceItem.fluidColor.slice(0, -2)}` // Remove alpha from hex color
        : null;

    const pathStyle: React.CSSProperties = {
        ...style,
        stroke: isFluid
            ? (outputTooHigh ? "rgba(255,90,90,0.7)" : (fluidColor ?? "rgba(255,255,255,0.4)"))
            : (outputTooHigh ? "#790000" : style?.stroke),
    };

    const labelStyle: React.CSSProperties = {
        width: `${displayAmount.length === 0 ? 1.5 : displayAmount.length + 0.5}ch`,
        color: outputTooHigh ? "#ff5a5a" : "white",
        borderRadius: "10px",
    };

    const { edgePath, labelX, labelY, middlePoints } = useMemo(() => {
        if (movablePoints.length > 0) {
            const points = [{ id: "source", x: sourceX, y: sourceY }, ...movablePoints, { id: "target", x: targetX, y: targetY }];
            const customPath = getCustomBezierCurve(points);
            const labelPoint: MovablePoint = movablePoints.find(p => p.id === "label") ?? { id: "label", x: baseLabelX, y: baseLabelY };
            return {
                edgePath: customPath.path,
                labelX: labelPoint.x,
                labelY: labelPoint.y,
                middlePoints: movablePoints.length < MAX_MOVABLE_POINTS ? customPath.middlePoints : [],
            };
        }
        return {
            edgePath: basePath,
            labelX: baseLabelX,
            labelY: baseLabelY,
            middlePoints: [{ x: baseLabelX, y: baseLabelY }],
        };
    }, [movablePoints, sourceX, sourceY, targetX, targetY, basePath, baseLabelX, baseLabelY]);

    const addMovablePoint = useCallback((idx: number) => {
        const current = data?.movablePoints ?? [];
        if (current.length >= MAX_MOVABLE_POINTS) return;
        const middlePoint = middlePoints[idx];
        const newId = current.length === 0 ? "label" : `${current.length}`;
        const newPoint: MovablePoint = { id: newId, x: middlePoint.x, y: middlePoint.y };
        const next = [...current];
        next.splice(idx, 0, newPoint);
        // Write directly to Yjs — data prop update will re-render with the new point.
        updateEdgeData(id, { movablePoints: next });
    }, [middlePoints, data?.movablePoints, id, updateEdgeData]);

    const handleDragStart = useCallback((e: React.MouseEvent, idx: number) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const origin = (data?.movablePoints ?? [])[idx];
        const base = [...(data?.movablePoints ?? [])];
        const { zoom } = reactFlow.getViewport();

        // Seed the drag buffer from the current Yjs data.
        setDragBuffer(base);

        // Use a local mutable array as scratch pad so mousemove doesn't
        // create a new closure / stale-closure problem with setState.
        const scratch = [...base];

        function onMouseMove(moveEvent: MouseEvent) {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;
            scratch[idx] = { ...origin, x: origin.x + dx, y: origin.y + dy };
            setDragBuffer([...scratch]);
        }
        
        function onMouseUp(upEvent: MouseEvent) {
            upEvent.stopPropagation();
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp, { capture: true });
            // Suppress the pointerup and click that ReactFlow uses to deselect.
            const suppress = (ev: Event) => ev.stopPropagation();
            window.addEventListener("pointerup", suppress, { capture: true, once: true });
            window.addEventListener("click", suppress, { capture: true, once: true });
            // Clear drag buffer first so render falls back to data prop after Yjs commit.
            setDragBuffer(null);
            // Commit to Yjs — data prop update will take over rendering.
            updateEdgeData(id, { movablePoints: scratch });
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp, { capture: true });
    }, [data?.movablePoints, reactFlow, id, updateEdgeData]);

    const renderDraggablePoints = useCallback(() => {
        return (
            <>
                {middlePoints.map((p, idx) => (
                    <Plus key={idx}
                          style={{
                              transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                              pointerEvents: "all",
                          }}
                          className="add-handle"
                          onClick={(e) => {
                              e.stopPropagation();
                              addMovablePoint(idx);
                          }}/>
                ))}
                {movablePoints.length > 0 &&
                    movablePoints.map((p, idx) => (
                        <div
                            key={idx}
                            style={{
                                transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                                pointerEvents: "all",
                                cursor: "move",
                                zIndex: 10000,
                            }}
                            className="position-handle"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => handleDragStart(e, idx)}
                        />
                    ))}
            </>
        );
    }, [middlePoints, movablePoints, addMovablePoint, handleDragStart]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={pathStyle} className={isFluid ? "fluid-edge" : undefined} />

            {(sourceNode?.selected || targetNode?.selected || selected) && sourceItem && (
                <>
                    {outputTooHigh && (
                        <circle cx="0" cy="0" r="4" id="radar">
                            <animateMotion dur="8s" repeatCount="indefinite" path={edgePath} begin={"0s"} calcMode="linear" />
                        </circle>
                    )}
                    <image
                        href={`/media/${sourceItem.icon}_256.webp`}
                        x={-10} y={-10} height="20px" width="20px"
                    >
                        <animateMotion dur="8s" repeatCount="indefinite" path={edgePath} begin={"0s"} calcMode="linear"/>
                    </image>
                </>
            )}

            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan"
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - (selected ? 20 : 0)}px)`,
                        fontSize: 12,
                        pointerEvents: "all",
                    }}
                >
                    <input
                        type="number"
                        inputMode="decimal"
                        className="form-control fs-8 num-input text-center"
                        placeholder="0"
                        value={displayAmount}
                        onChange={handleThroughputChange}
                        style={labelStyle}
                        onClickCapture={e => e.stopPropagation()}
                        onDoubleClickCapture={e => e.stopPropagation()}
                    />
                </div>
            </EdgeLabelRenderer>
            <EdgeLabelRenderer>
                {selected && renderDraggablePoints()}
            </EdgeLabelRenderer>
        </>
    );
});

