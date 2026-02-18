import {createFileRoute} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import ChartEditor from "../components/editor/ChartEditor.tsx";
import {ReactFlowProvider} from "@xyflow/react";

export const Route = createFileRoute('/edit/$project')({
    component: Editor,
    beforeLoad: ({context}) => {
        if (!context.auth?.isAuthenticated) {
            throw redirect({to: '/login', replace: true});
        }
    },
    staticData: {
        showNav: false,
        title: "Ficsit Together | Edit"
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
