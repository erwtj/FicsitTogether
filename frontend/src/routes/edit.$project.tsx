import {createFileRoute} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import ChartEditor from "../editor/ChartEditor.tsx";
import {ReactFlowProvider} from "@xyflow/react";

export const Route = createFileRoute('/edit/$project')({
    component: Editor,
    staticData: {
        showNav: false,
        title: "Ficsit Together | Edit",
        requireAuth: true
    }
})

function Editor() {
    const { project: project } = Route.useParams();
    
    return(
        <ReactFlowProvider>
            <ChartEditor projectId={project}/>
        </ReactFlowProvider>
    );
}
