import {createFileRoute, notFound} from '@tanstack/react-router'
import {getPublicProject} from "../../api/apiCalls.ts";
import "../../view/ChartViewer.css"
import {ChartViewer} from "../../view/ChartViewer.tsx";

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

function RouteComponent() {
    const { project } = Route.useLoaderData();
    
    return (<ChartViewer project={project} />);
}
