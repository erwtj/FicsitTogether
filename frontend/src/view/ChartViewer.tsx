import {Background, BackgroundVariant, MiniMap, ReactFlow,
    ReactFlowProvider, useNodesState, useEdgesState, type Edge, type Node, useUpdateNodeInternals,
    Panel} from "@xyflow/react";
import type { PublicProjectDTO } from "dtolib";
import {type ItemEdgeData, nodeColor} from "../editor/types";
import { useFactorySync } from "../editor/hooks/useFactorySync";
import {nodeTypes} from "./nodes";
import {edgeTypes} from "./edges";
import { useEffect } from "react";

import "./ChartViewer.css";
import {useClientSettings} from "../hooks/useClientSettings.ts";
import {OverviewSidePanel} from "./components/OverviewSidePanel.tsx";

// Drop persisted measurement fields so React Flow measures node width/height from the current DOM/CSS.
function resetNodeMeasurements(node: Node): Node {
    const normalized = { ...node } as Node & {
        width?: number;
        height?: number;
        measured?: { width?: number; height?: number };
    };

    delete normalized.width;
    delete normalized.height;
    delete normalized.measured;

    return normalized as Node;
}

function ViewProject({ project }: { project: PublicProjectDTO }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const updateNodeInternals = useUpdateNodeInternals();

    const {clientSettings} = useClientSettings();

    useFactorySync(edges as Edge<ItemEdgeData>[], nodes);

    useEffect(() => {
        const normalizedNodes = project.chart.nodes.map((n) => resetNodeMeasurements(n as Node));

        setNodes(normalizedNodes);
        setEdges(project.chart.edges);

        requestAnimationFrame(() => { // Animation frame to ensure nodes are rendered before measuring
            normalizedNodes.forEach((n) => updateNodeInternals(n.id));
        });
    }, [project.chart.edges, project.chart.nodes, setEdges, setNodes, updateNodeInternals]);

    return <div style={{ width: "100%", height: "100vh" }}>
        <ReactFlow
            style={{outline: "none"}}
            tabIndex={-1}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ style: { strokeWidth: 1.75 } }}
            zoomOnDoubleClick={false}
            nodeOrigin={[0.5, 0.0]}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Shift', 'Control']}
            fitView
        >
            <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
            {clientSettings.minimapEnabled && <MiniMap className="bg-body" position="top-right" nodeColor={clientSettings.minimapColors ? nodeColor : undefined}/>}
            <Panel position={"top-left"} className={"h-100"} style={{placeContent: "center"}}>
                <OverviewSidePanel project={project}/>
            </Panel>
        </ReactFlow>

        <div className="experimental-ribbon no-drag">
            Experimental
        </div>
    </div>
}

export function ChartViewer({ project }: { project: PublicProjectDTO }) {
    return (
        <ReactFlowProvider>
            <ViewProject project={project}/>
        </ReactFlowProvider>
    );
}