import {createFileRoute, notFound} from '@tanstack/react-router'
import {fetchPublicProject} from "../../api/apiCalls.ts";
import "../../view/ChartViewer.css"
import {ChartViewer} from "../../view/ChartViewer.tsx";

export const Route = createFileRoute('/view/projects/$project')({
    component: RouteComponent,
    staticData: {
        showNav: false,
        title: "Ficsit Together | View Project",
        requireAuth: false
    },
    loader: async ({params}) => {
        const {project} = params;
        
        const proj = await fetchPublicProject(project).catch(err => {
            if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                throw notFound()
            }
            throw err
        });

        return {project: proj};
    },
    staleTime: 0
})

function RouteComponent() {
    const { project } = Route.useLoaderData();
    
    return (<ChartViewer project={project} />);
}
