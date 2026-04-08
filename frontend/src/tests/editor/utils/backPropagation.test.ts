import { describe, it, assert } from "vitest";
import { buildBackPropagationPatch } from "../../../editor/utils/backPropagation";
import type {
    EndNodeData,
    EndNodeType,
    ItemEdgeType,
    ItemSpawnerNodeData,
    ItemSpawnerNodeType,
    RecipeNodeData,
    RecipeNodeType,
} from "../../../editor/types";

type GraphNodes = Parameters<typeof buildBackPropagationPatch>[0];
type GraphEdges = Parameters<typeof buildBackPropagationPatch>[1];
type GraphPatchSet = NonNullable<ReturnType<typeof buildBackPropagationPatch>>;

type HandleArgs = {
    nodeId: string;
    index?: number;
};

type RecipeNodeArgs = Pick<RecipeNodeType, "id"> & Pick<RecipeNodeData, "recipeClassName">;
type EndNodeArgs = Pick<EndNodeType, "id"> & Pick<EndNodeData, "itemClassName">;
type ItemSpawnerNodeArgs = Pick<ItemSpawnerNodeType, "id"> & Pick<ItemSpawnerNodeData, "itemClassName" | "outputAmount">;

type EdgeArgs = {
    id: string;
    source: string;
    target: string;
    throughput: number;
    sourceHandle: string;
    targetHandle: string;
};

type GetPatchOrThrowArgs = {
    nodes: GraphNodes;
    edges: GraphEdges;
    edgeId: string;
    desiredThroughput: number;
};

function outputHandle({ nodeId, index = 0 }: HandleArgs) {
    return `${nodeId}-output-handle-${index}`;
}

function inputHandle({ nodeId, index = 0 }: HandleArgs) {
    return `${nodeId}-input-handle-${index}`;
}

function recipeNode({ id, recipeClassName }: RecipeNodeArgs): RecipeNodeType {
    return {
        id,
        type: "recipe-node",
        position: { x: 0, y: 0 },
        data: {
            recipeClassName,
        },
    } satisfies RecipeNodeType;
}

function itemSpawnerNode({ id, itemClassName, outputAmount }: ItemSpawnerNodeArgs): ItemSpawnerNodeType {
    return {
        id,
        type: "item-spawner-node",
        position: { x: 0, y: 0 },
        data: {
            itemClassName,
            outputAmount,
        },
    } satisfies ItemSpawnerNodeType;
}

function endNode({ id, itemClassName }: EndNodeArgs): EndNodeType {
    return {
        id,
        type: "end-node",
        position: { x: 0, y: 0 },
        data: {
            itemClassName,
            sinkOutput: false,
        },
    } satisfies EndNodeType;
}

function edge({ id, source, target, throughput, sourceHandle, targetHandle }: EdgeArgs): ItemEdgeType {
    return {
        id,
        type: "item-edge",
        source,
        target,
        sourceHandle,
        targetHandle,
        data: { throughput },
        selected: false,
    } satisfies ItemEdgeType;
}

function getPatch({ nodes, edges, edgeId, desiredThroughput }: GetPatchOrThrowArgs): GraphPatchSet {
    const patch = buildBackPropagationPatch(nodes, edges, edgeId, desiredThroughput);
    assert.notEqual(patch, null, "expected buildBackPropagationPatch to return a patch set");
    //@ts-expect-error will never happen due to the assertion above, but this keeps TypeScript happy
    return patch;
}

describe("buildBackPropagationPatch", () => {
    // Setup: one item spawner feeds one iron smelter, and the smelter feeds one end node.
    // Action: edit the downstream edge "smelter-to-end" from 60 to 90.
    // Expectation: the upstream edge "ore-to-smelter" is raised to 90 as well, and the spawner node patch sets "outputAmount" to 90 because its only outgoing edge now totals 90/min
    it("scales a simple upstream chain and updates the spawner output amount", () => {
        const nodes: GraphNodes = [
            itemSpawnerNode({ id: "ore-spawner", itemClassName: "Desc_OreIron_C", outputAmount: 60 }),
            recipeNode({ id: "iron-smelter", recipeClassName: "Recipe_IngotIron_C" }),
            endNode({ id: "ingot-end", itemClassName: "Desc_IronIngot_C" }),
        ];

        const edges: GraphEdges = [
            edge({
                id: "ore-to-smelter",
                source: "ore-spawner",
                target: "iron-smelter",
                throughput: 60,
                sourceHandle: outputHandle({ nodeId: "ore-spawner" }),
                targetHandle: inputHandle({ nodeId: "iron-smelter" }),
            }),
            edge({
                id: "smelter-to-end",
                source: "iron-smelter",
                target: "ingot-end",
                throughput: 60,
                sourceHandle: outputHandle({ nodeId: "iron-smelter" }),
                targetHandle: inputHandle({ nodeId: "ingot-end" }),
            }),
        ];

        const patch = getPatch({ nodes, edges, edgeId: "smelter-to-end", desiredThroughput: 90 });

        assert.strictEqual(patch.edgePatches["smelter-to-end"].throughput, 90);
        assert.strictEqual(patch.edgePatches["ore-to-smelter"].throughput, 90);
        assert.strictEqual(patch.nodePatches["ore-spawner"].outputAmount, 90);
    });

    // Setup: Alumina Solution feeds Aluminum Scrap, whose water byproduct loops back into the Alumina Solution refinery while an external water spawner provides the remaining water.
    // Action: edit the aluminum scrap output edge from 240/min to 720/min.
    // Expectation: Aluminum Scrap now returns 240 water/min on its byproduct handle, so the loop-back edge must be corrected to 240. The remaining Alumina Solution water demand then comes from the external water spawner, which rises from 1600 to 4800.
    it("aluminum loop where loop-back water must stay fixed and only the fresh input should absorb the remainder", () => {
        const nodes: GraphNodes = [
            recipeNode({ id: "alumina-refinery", recipeClassName: "Recipe_AluminaSolution_C" }),
            recipeNode({ id: "scrap-refinery", recipeClassName: "Recipe_AluminumScrap_C" }),
            itemSpawnerNode({ id: "coal-spawner", itemClassName: "Desc_Coal_C", outputAmount: 240 }),
            itemSpawnerNode({ id: "water-spawner", itemClassName: "Desc_Water_C", outputAmount: 480000 }),
            endNode({ id: "scrap-end", itemClassName: "Desc_AluminumScrap_C" }),
            endNode({ id: "silica-end", itemClassName: "Desc_Silica_C" }),
        ];

        const edges: GraphEdges = [
            edge({
                id: "alumina-to-scrap",
                source: "alumina-refinery",
                target: "scrap-refinery",
                throughput: 160000,
                sourceHandle: outputHandle({ nodeId: "alumina-refinery", index: 0 }),
                targetHandle: inputHandle({ nodeId: "scrap-refinery", index: 0 }),
            }),
            edge({
                id: "coal-to-scrap",
                source: "coal-spawner",
                target: "scrap-refinery",
                throughput: 80,
                sourceHandle: outputHandle({ nodeId: "coal-spawner" }),
                targetHandle: inputHandle({ nodeId: "scrap-refinery", index: 1 }),
            }),
            edge({
                id: "scrap-to-end",
                source: "scrap-refinery",
                target: "scrap-end",
                throughput: 240,
                sourceHandle: outputHandle({ nodeId: "scrap-refinery", index: 0 }),
                targetHandle: inputHandle({ nodeId: "scrap-end" }),
            }),
            edge({
                id: "water-loop-back",
                source: "scrap-refinery",
                target: "alumina-refinery",
                throughput: 80000,
                sourceHandle: outputHandle({ nodeId: "scrap-refinery", index: 1 }),
                targetHandle: inputHandle({ nodeId: "alumina-refinery", index: 1 }),
            }),
            edge({
                id: "fresh-water-to-alumina",
                source: "water-spawner",
                target: "alumina-refinery",
                throughput: 160000,
                sourceHandle: outputHandle({ nodeId: "water-spawner" }),
                targetHandle: inputHandle({ nodeId: "alumina-refinery", index: 1 }),
            }),
            edge({
                id: "alumina-to-silica-end",
                source: "alumina-refinery",
                target: "silica-end",
                throughput: 66.66666666666666,
                sourceHandle: outputHandle({ nodeId: "alumina-refinery", index: 1 }),
                targetHandle: inputHandle({ nodeId: "silica-end" }),
            }),
        ];

        const patch = getPatch({ nodes, edges, edgeId: "scrap-to-end", desiredThroughput: 720 });
        assert.strictEqual(patch.edgePatches["scrap-to-end"].throughput, 720);
        assert.strictEqual(patch.edgePatches["alumina-to-scrap"].throughput, 480000);
        assert.strictEqual(patch.edgePatches["coal-to-scrap"].throughput, 240);
        assert.strictEqual(patch.edgePatches["water-loop-back"].throughput, 240000);
        assert.strictEqual(patch.edgePatches["fresh-water-to-alumina"].throughput, 480000);
        assert.strictEqual(patch.nodePatches["water-spawner"].outputAmount, 480000);
        assert.strictEqual(patch.edgePatches["alumina-to-silica-end"].throughput, 200);
    });
});
