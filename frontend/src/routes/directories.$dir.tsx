import {createFileRoute, notFound} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {
    fetchDirectoryContent, fetchTotalCounts,
    fetchUser,
} from "../api/apiCalls.ts";
import {DirectoryExplorer} from "../components/explorer/DirectoryExplorer.tsx";

export const Route = createFileRoute('/directories/$dir')({
    component: DirectoryPage,
    staticData: {
        showNav: true,
        title: "Ficsit Together | Directories",
        requireAuth: true
    },
    loader: async ({context, params: {dir}}) => {
        const { auth } = context;
        if (!auth) throw redirect({ to: '/login', replace: true })

        const [user, directory, totalCounts] = await Promise.all([
            fetchUser(auth),
            fetchDirectoryContent(auth, dir).catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                    throw notFound()
                }
                throw err
            }),
            fetchTotalCounts(auth,  dir)
        ])

        if (directory.id === directory.parentDirectoryId) {
            throw redirect({ to: '/home', replace: true })
        }

        return { user, directory, totalCounts }
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
    const auth = useAuth0Context()

    const { user, directory, totalCounts } = Route.useLoaderData();
    
    return <DirectoryExplorer isPublic={false} totalCounts={totalCounts} directory={directory} user={user} auth={auth}/>
}

