import { memo, useCallback, useEffect, useMemo } from "react";
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
import { useState } from "react";

export const ItemEdge = memo(function ItemEdge({
    id,
    source,
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
    const [movablePoints, setMovablePoints] = useState<MovablePoint[]>(data?.movablePoints ?? []);

    let [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition,
        targetX, targetY, targetPosition,
    });

    // ── Source node (direct read, not a subscription) ──────────────────
    // We only need the source node for the item icon and outputTooHigh flag.
    // useFactorySync has already baked _outputOverUsed into the node's data,
    // so re-renders happen only when node data changes — not on position moves.
    const sourceNode = reactFlow.getNode(source);

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

    useEffect(() => {
        reactFlow.updateEdge(id, { animated: isFluid });
    }, [isFluid, id, reactFlow]);

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

    // ── Styles ─────────────────────────────────────────────────────────────
    const pathStyle: React.CSSProperties = {
        ...style,
        stroke: outputTooHigh ? "#790000" :
            isFluid ? `#${sourceItem?.fluidColor.slice(0, -2)}` : style?.stroke,
    };

    const labelStyle: React.CSSProperties = {
        width: `${displayAmount.length === 0 ? 1.5 : displayAmount.length + 0.5}ch`,
        color: outputTooHigh ? "#ff5a5a" : "white",
        borderRadius: "10px",
    };

    const middlePoints = [{ x: labelX, y: labelY }];

    if (movablePoints.length > 0) {
        middlePoints.pop();
        const points = [{ id: "target", x: sourceX, y: sourceY }, ...movablePoints, { id: "target", x: targetX, y: targetY }];
        const customPath = getCustomBezierCurve(points);
        edgePath = customPath.path;
        const labelPoint: MovablePoint = movablePoints.find(p => p.id === "label") ?? { id: "label", x: labelX, y: labelY };
        labelX = labelPoint.x;
        labelY = labelPoint.y;
        middlePoints.push(...customPath.middlePoints);
    }

    function addMovablePoint(idx: number) {
        const middlePoint = middlePoints[idx];
        const newId = movablePoints.length === 0 ? "label" : `${movablePoints.length}`;
        const newPoint: MovablePoint = { id: newId, x: middlePoint.x, y: middlePoint.y };
        setMovablePoints(prev => {
            const next = [...prev];
            next.splice(idx, 0, newPoint);
            return next;
        });
    }

    function renderDraggablePoints() {
        return (
            <>
                {middlePoints.map((p, idx) => (
                    <div
                        key={idx}
                        style={{
                            transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                            pointerEvents: "all"
                        }}
                        className="add-handle"
                        onClick={(e) => {
                            e.stopPropagation();
                            addMovablePoint(idx);
                        }}
                    />
                ))}
                {movablePoints.length > 0 &&
                    movablePoints.map((p, idx) => (
                        <div
                            key={idx}
                            style={{
                                transform: `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`,
                                pointerEvents: "all",
                                cursor: "move",
                            }}
                            className="position-handle"
                            onClick={(e) => (e.stopPropagation())}
                        />
                    ))}
            </>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={pathStyle} />

            {selected && sourceItem && (
                <>
                    {outputTooHigh && (
                        <circle cx="0" cy="0" r="4" id="radar">
                            <animateMotion dur="8s" repeatCount="indefinite" path={edgePath} />
                        </circle>
                    )}
                    <image
                        href={`/media/${sourceItem.icon}_256.webp`}
                        x={-10} y={-10} height="20px" width="20px"
                    >
                        <animateMotion dur="8s" repeatCount="indefinite" path={edgePath} />
                    </image>
                </>
            )}

            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan"
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
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

