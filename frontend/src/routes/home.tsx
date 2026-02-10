import { createFileRoute, redirect} from '@tanstack/react-router'


export const Route = createFileRoute('/home')({
    beforeLoad: ({context}) => {
        if (!context.auth?.isAuthenticated) {
            throw redirect({to: '/login', replace: true});
        }
    },
    component: RouteComponent,
    staticData: {
        title: "Ficsit Together | Home",
        showNav: true,
    }
})

function RouteComponent() {

  return (
      <></>
  )
}
