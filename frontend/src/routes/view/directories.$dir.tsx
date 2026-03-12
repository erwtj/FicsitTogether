import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/view/directories/$dir')({
    component: RouteComponent,
    staticData: {
        showNav: false,
        title: "Ficsit Together | View Directory",
        requireAuth: false
    }
})

function RouteComponent() {
    return <div>Hello "/view/directories/$dir"!</div>
}
