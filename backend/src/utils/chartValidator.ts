import type { SloopData, ChartDataDTO, NodeDTO, EdgeDTO, RecipeNodeData, ItemSpawnerNodeData, EndNodeData, PowerNodeData } from "dtolib";
import { hasRecipe, getRecipe, hasItem, getBuilding } from "ficlib";
import { MAX_CHART_NODES, MAX_CHART_EDGES, MAX_MOVABLE_POINTS } from "dtolib";

// Maximum sensible values
const MAX_COORD = 1_000_000;
const MAX_NODE_SIZE = 10_000;
const MAX_THROUGHPUT = 1_000_000;
const MAX_OUTPUT_AMOUNT = 1_000_000_000; // mL/min for fluids
const MAX_SOMERSLOOPS = 4;
const MAX_PERCENTAGE = 250;
const MAX_MOVABLE_POINT_COORD = 1_000_000;

// Valid node types
const VALID_NODE_TYPES = new Set(['recipe-node', 'item-spawner-node', 'end-node', 'power-node']);

// Valid edge types (currently only one but leave room for more)
const VALID_EDGE_TYPES = new Set(['item-edge']);

function isString(v: unknown): v is string {
    return typeof v === 'string';
}

function isFiniteNumber(v: unknown): v is number {
    return typeof v === 'number' && isFinite(v);
}

function isNodeId(v: string): boolean {
    return /^node-[0-9a-f]{32}$/i.test(v);
}

function isEdgeId(v: string): boolean {
    return /^edge-[0-9a-f]{32}$/i.test(v);
}

/**
 * Returns the set of valid handle IDs for a given node based on its type and data.
 * Returns null if the node itself is invalid.
 */
function getValidHandleIds(node: NodeDTO): { inputs: Set<string>; outputs: Set<string> } | null {
    const id = node.id;

    switch (node.type) {
        case 'recipe-node': {
            const data = node.data as RecipeNodeData;
            const recipe = getRecipe(data.recipeClassName);
            if (!recipe) return null;
            return {
                inputs: new Set(recipe.input.map((_, i) => `${id}-input-handle-${i}`)),
                outputs: new Set(recipe.output.map((_, i) => `${id}-output-handle-${i}`)),
            };
        }
        case 'power-node': {
            const data = node.data as PowerNodeData;
            const recipe = getRecipe(data.recipeClassName);
            if (!recipe) return null;
            // Power nodes only have input handles (fuel inputs), no output handles
            return {
                inputs: new Set(recipe.input.map((_, i) => `${id}-input-handle-${i}`)),
                outputs: new Set(),
            };
        }
        case 'item-spawner-node': {
            return {
                inputs: new Set(),
                outputs: new Set([`${id}-output-handle-0`]),
            };
        }
        case 'end-node': {
            return {
                inputs: new Set([`${id}-input-handle-0`]),
                outputs: new Set(),
            };
        }
        default:
            return null;
    }
}

function sanitizeRecipeNodeData(raw: unknown): RecipeNodeData | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;

    if (!isString(d.recipeClassName) || !hasRecipe(d.recipeClassName)) return null;

    const recipe = getRecipe(d.recipeClassName)!;
    const building = getBuilding(recipe.producedIn);
    const maxSloops = Math.max(0, building?.somersloopsNeeded ?? 0);

    if (!d.sloopData || !Array.isArray(d.sloopData) || maxSloops === 0) {
        return {
            recipeClassName: d.recipeClassName,
        };
    }
    
    const data = d.sloopData as unknown[];
    if (!data.every(s => {
        if (!s || typeof s !== 'object') return false;
        const sloopBuildingData = s as Record<string, unknown>;
        
        return isFiniteNumber(sloopBuildingData.sloopAmount) && isFiniteNumber(sloopBuildingData.overclockPercentage) 
    })) {
        return {
            recipeClassName: d.recipeClassName,
        };
    }
    
    const sloopData = data as SloopData[];
    
    const sanitizedSloopData = sloopData.map(s => ({
        sloopAmount: Math.max(0, Math.min(maxSloops, s.sloopAmount)),
        overclockPercentage: Math.max(0, Math.min(MAX_PERCENTAGE, s.overclockPercentage)),
    }));
    
    return {
        recipeClassName: d.recipeClassName,
        sloopData: sanitizedSloopData,
    };
}

function sanitizeItemSpawnerNodeData(raw: unknown): ItemSpawnerNodeData | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;

    if (!isString(d.itemClassName) || !hasItem(d.itemClassName)) return null;

    const outputAmount = isFiniteNumber(d.outputAmount)
        ? Math.max(0, Math.min(MAX_OUTPUT_AMOUNT, d.outputAmount))
        : 0;

    return {
        itemClassName: d.itemClassName,
        outputAmount,
    };
}

function sanitizeEndNodeData(raw: unknown): EndNodeData | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;

    if (!isString(d.itemClassName) || !hasItem(d.itemClassName)) return null;

    return {
        itemClassName: d.itemClassName,
        sinkOutput: d.sinkOutput === true,
    };
}

function sanitizePowerNodeData(raw: unknown): PowerNodeData | null {
    if (!raw || typeof raw !== 'object') return null;
    const d = raw as Record<string, unknown>;

    if (!isString(d.recipeClassName) || !hasRecipe(d.recipeClassName)) return null;

    // Power nodes use generator recipes — verify the recipe is produced in a power building
    const recipe = getRecipe(d.recipeClassName)!;
    const building = getBuilding(recipe.producedIn);
    if (!building || building.powerProduction === 0) return null;

    return {
        recipeClassName: d.recipeClassName,
    };
}

function sanitizeNode(raw: unknown): NodeDTO | null {
    if (!raw || typeof raw !== 'object') return null;
    const n = raw as Record<string, unknown>;

    if (!isString(n.id) || !isNodeId(n.id)) return null;
    if (!isString(n.type) || !VALID_NODE_TYPES.has(n.type)) return null;

    const pos = n.position as Record<string, unknown> | undefined;
    if (!pos || !isFiniteNumber(pos.x) || !isFiniteNumber(pos.y)) return null;

    const x = Math.max(-MAX_COORD, Math.min(MAX_COORD, pos.x));
    const y = Math.max(-MAX_COORD, Math.min(MAX_COORD, pos.y));

    const width = isFiniteNumber(n.width) ? Math.max(1, Math.min(MAX_NODE_SIZE, n.width)) : 200;
    const height = isFiniteNumber(n.height) ? Math.max(1, Math.min(MAX_NODE_SIZE, n.height)) : 100;

    let sanitizedData: RecipeNodeData | ItemSpawnerNodeData | EndNodeData | PowerNodeData | null = null;

    switch (n.type) {
        case 'recipe-node':
            sanitizedData = sanitizeRecipeNodeData(n.data);
            break;
        case 'item-spawner-node':
            sanitizedData = sanitizeItemSpawnerNodeData(n.data);
            break;
        case 'end-node':
            sanitizedData = sanitizeEndNodeData(n.data);
            break;
        case 'power-node':
            sanitizedData = sanitizePowerNodeData(n.data);
            break;
    }

    if (!sanitizedData) return null;

    return {
        id: n.id,
        type: n.type as NodeDTO['type'],
        position: { x, y },
        data: sanitizedData,
        width,
        height,
    };
}

function sanitizeEdge(raw: unknown, validNodeIds: Set<string>, handleMap: Map<string, { inputs: Set<string>; outputs: Set<string> }>): EdgeDTO | null {
    if (!raw || typeof raw !== 'object') return null;
    const e = raw as Record<string, unknown>;

    if (!isString(e.id) || !isEdgeId(e.id)) return null;

    const type = isString(e.type) && VALID_EDGE_TYPES.has(e.type) ? e.type : 'item-edge';

    if (!isString(e.source) || !validNodeIds.has(e.source)) return null;
    if (!isString(e.target) || !validNodeIds.has(e.target)) return null;
    if (e.source === e.target) return null; // No self-loops

    if (!isString(e.sourceHandle) || !isString(e.targetHandle)) return null;

    // Validate that handles actually exist on those nodes
    const sourceHandles = handleMap.get(e.source);
    const targetHandles = handleMap.get(e.target);
    if (!sourceHandles || !targetHandles) return null;
    if (!sourceHandles.outputs.has(e.sourceHandle)) return null;
    if (!targetHandles.inputs.has(e.targetHandle)) return null;

    const data = e.data as Record<string, unknown> | undefined;
    const throughput = data && isFiniteNumber(data.throughput)
        ? Math.max(0, Math.min(MAX_THROUGHPUT, data.throughput))
        : 0;

    let movablePoints: EdgeDTO['data']['movablePoints'] = undefined;
    if (data && Array.isArray(data.movablePoints)) {
        const sanitized = (data.movablePoints as unknown[])
            .slice(0, MAX_MOVABLE_POINTS)
            .filter((p): p is { id: string; x: number; y: number } => {
                if (!p || typeof p !== 'object') return false;
                const pt = p as Record<string, unknown>;
                return (
                    isString(pt.id) &&
                    pt.id.length > 0 &&
                    pt.id.length <= 100 &&
                    isFiniteNumber(pt.x) &&
                    isFiniteNumber(pt.y) &&
                    Math.abs(pt.x as number) <= MAX_MOVABLE_POINT_COORD &&
                    Math.abs(pt.y as number) <= MAX_MOVABLE_POINT_COORD
                );
            })
            .map(p => ({ id: p.id, x: p.x, y: p.y }));

        if (sanitized.length > 0) movablePoints = sanitized;
    }

    return {
        id: e.id,
        type,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        data: movablePoints
            ? { throughput, movablePoints }
            : { throughput },
        selected: false, // Never persist selected state
    };
}

/**
 * Sanitizes and validates an entire chart.
 * Invalid nodes are dropped. Edges referencing dropped nodes or invalid handles are dropped.
 * Returns a clean ChartDataDTO safe to persist.
 */
export function sanitizeChart(raw: unknown): ChartDataDTO {
    if (!raw || typeof raw !== 'object') {
        return { nodes: [], edges: [] };
    }

    const chart = raw as Record<string, unknown>;

    const rawNodes = Array.isArray(chart.nodes) ? chart.nodes : [];
    const rawEdges = Array.isArray(chart.edges) ? chart.edges : [];

    // Sanitize nodes
    const seenNodeIds = new Set<string>();
    const sanitizedNodes: NodeDTO[] = [];
    const handleMap = new Map<string, { inputs: Set<string>; outputs: Set<string> }>();

    for (const rawNode of rawNodes.slice(0, MAX_CHART_NODES)) {
        const node = sanitizeNode(rawNode);
        if (!node) continue;
        if (seenNodeIds.has(node.id)) continue; // Remove duplicates

        const handles = getValidHandleIds(node);
        if (!handles) continue;

        seenNodeIds.add(node.id);
        sanitizedNodes.push(node);
        handleMap.set(node.id, handles);
    }

    // Sanitize edges based on nodes
    const seenEdgeIds = new Set<string>();
    const sanitizedEdges: EdgeDTO[] = [];

    for (const rawEdge of rawEdges.slice(0, MAX_CHART_EDGES)) {
        const edge = sanitizeEdge(rawEdge, seenNodeIds, handleMap);
        if (!edge) continue;
        if (seenEdgeIds.has(edge.id)) continue; // Remove duplicates

        seenEdgeIds.add(edge.id);
        sanitizedEdges.push(edge);
    }

    return { nodes: sanitizedNodes, edges: sanitizedEdges };
}




