import {createFileRoute, notFound, redirect} from '@tanstack/react-router'
import {fetchPublicDirectory} from "../../api/apiCalls.ts";
import {DirectoryExplorer} from "../../components/explorer/DirectoryExplorer.tsx";

export const Route = createFileRoute('/view/directories/$dir')({
    component: DirectoryPage,
    staticData: {
        showNav: true,
        title: "Ficsit Together | View Directory",
        requireAuth: false
    },
    loader: async ({params: {dir}}) => {
        const directory=  
            await fetchPublicDirectory(dir).catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                    throw notFound()
                }
                throw err
            });

        if (directory.id === directory.parentDirectoryId) {
            throw redirect({ to: '/home', replace: true })
        }

        return { directory }
    },
    staleTime: 0
})

function DirectoryPage() {
    const { dir: dirId } = Route.useParams();
    return (
        <DirectoryPageContent key={dirId}/> // Force remount when directory changes to reset state
    );
}

function DirectoryPageContent() {
    const { directory } = Route.useLoaderData();

    return <DirectoryExplorer isPublic={true} directory={directory}/>
}
