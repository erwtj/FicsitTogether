import {createFileRoute, notFound} from '@tanstack/react-router'
import {getPublicProject} from "../../api/apiCalls.ts";
import {nodeTypes} from "../../view/nodes";
import {edgeTypes} from "../../view/edges";
import {type ItemEdgeData, nodeColor} from "../../editor/types.ts";
import {Background, BackgroundVariant, MiniMap, ReactFlow, ReactFlowProvider,
    useEdgesState, useNodesState, type Edge, type Node} from "@xyflow/react";
import type { PublicProjectDTO } from "dtolib";
import "./ChartEditor.css"
import {useFactorySync} from "../../editor/hooks/useFactorySync.ts";

export const Route = createFileRoute('/view/project/$project')({
    component: RouteComponent,
    staticData: {
        showNav: false,
        title: "Ficsit Together | View Project",
        requireAuth: false
    },
    loader: async ({params}) => {
        const {project} = params;
        
        const proj = await getPublicProject(project);
        if (!proj) {
            throw notFound();
        }

        return {project: proj};
    }
})

function ViewProject({ project }: { project: PublicProjectDTO }) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(project.chart.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(project.chart.edges);
    
    useFactorySync(edges as Edge<ItemEdgeData>[], nodes);
    
    return <div style={{ width: "100%", height: "100vh" }}>
        <ReactFlow
            style={{outline: "none"}}
            tabIndex={-1}
            nodes={project.chart.nodes}
            edges={project.chart.edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ style: { strokeWidth: 1.75 } }}
            zoomOnDoubleClick={false}
            nodeOrigin={[0.5, 0.0]}
            fitView
            unselectable="on"
            selectNodesOnDrag={false}
            selectionOnDrag={false}
        >
            <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
            <MiniMap className="bg-body" position="top-right" nodeColor={nodeColor}/>
            {/*<Panel position={"top-left"} className={"h-100"} style={{placeContent: "center"}}>
                <OverviewSidePanel/>
            </Panel>*/}
        </ReactFlow>

        <div className="experimental-ribbon no-drag">
            Experimental
        </div>
    </div>
}

function RouteComponent() {
    const { project } = Route.useLoaderData();
    
    return (<ReactFlowProvider>
        <ViewProject project={project} />
    </ReactFlowProvider>);
}
