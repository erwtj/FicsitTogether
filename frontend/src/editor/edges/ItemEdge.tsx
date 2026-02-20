import { memo, useCallback, useEffect} from "react";
import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
    useReactFlow,
    useEdges,
} from "@xyflow/react";
import { getItem, getRecipe } from "ficlib";
import { type Item } from "ficlib";
import { isItemSolid, roundTo3Decimals } from "../../utils/throughputUtil.ts";
import { useYjsMutation } from "../hooks/useYjsMutation";
import { computeNodeFactor, totalThroughputForHandle } from "../utils/factoryCalc";
import {type ItemEdgeType, type RecipeNodeData, type ItemSpawnerNodeData, type MovablePoint} from "../types";
import {getCustomBezierCurve, pointOnPath} from "../utils/edgeUtils.ts";
import "./ItemEdge.css";
import {getItemIndexFromHandleId} from "../utils/idUtils.ts";
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

    // ── Derive item from source node via ficlib lookups ────────────────────
    const sourceNode = reactFlow.getNode(source);


    const sourceItem: Item | null = (() => {
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
    })();


    const isFluid = sourceItem ? !isItemSolid(sourceItem) : false;

    // TODO: Fix that the animated stops when throughput is edit
    useEffect(() => {
        reactFlow.updateEdge(id, { animated: isFluid });
    }, [isFluid, id, reactFlow]);

    // ── Over-capacity check ────────────────────────────────────────────────
    const allEdges = useEdges<ItemEdgeType>();

    const outputTooHigh = (() => {
        if (!sourceNode || !sourceHandleId || sourceNode.type !== "recipe-node") return false;

        const rd = sourceNode.data as RecipeNodeData;
        const recipe = getRecipe(rd.recipeClassName);
        if (!recipe) return false;

        const incomingEdges = allEdges.filter((e: { target: string; }) => e.target === source);
        const outgoingEdges = allEdges.filter((e: { source: string; }) => e.source === source);
        const factor = computeNodeFactor(recipe, rd.summerSloops, rd.percentage, incomingEdges, outgoingEdges);

        const outputIdx = getItemIndexFromHandleId(sourceHandleId);
        const outputItem = recipe.output[outputIdx];
        if (!outputItem) return false;

        const maxOut = outputItem.amount * (60 / recipe.duration) * factor.outputFactor;
        const usedOut = totalThroughputForHandle(outgoingEdges, sourceHandleId, "source");
        return roundTo3Decimals(usedOut) > roundTo3Decimals(maxOut);
    })();

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
            updateEdgeData(id, { throughput: isFluid ? val * 1000 : val});
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

    const middlePoints = [{x: labelX, y: labelY}];

    if (movablePoints.length > 0) {
        middlePoints.pop()
        const points = [{id: "target", x: sourceX, y: sourceY }, ...movablePoints, {id: "target", x: targetX, y: targetY }];
        const customPath = getCustomBezierCurve(points);
        edgePath = customPath.path;
        const labelPoint: MovablePoint = movablePoints.find(p => p.id === "label") ?? {id: "label", x: labelX, y: labelY};
        labelX = labelPoint.x;
        labelY = labelPoint.y;
        middlePoints.push(...customPath.middlePoints);
    }

    function addMovablePoint(idx: number) {
        const middlePoint = middlePoints[idx];
        const id = movablePoints.length === 0 ? "label" : `${movablePoints.length}`;
        const newPoint: MovablePoint = { id, x: middlePoint.x, y: middlePoint.y };
        setMovablePoints(prev => {
            const next = [...prev];
            next.splice(idx, 0, newPoint);
            return next;
        });
    }

    // TODO: Finish and rewrite moving points, currently the points are added but not movable
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
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={pathStyle}/>

            {/* Animated icon when edge is selected */}
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

            {/* Throughput label */}
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