import { createFileRoute, redirect} from '@tanstack/react-router'
import Profile from "../components/Profile.tsx";
import LogoutButton from "../components/buttons/LogoutButton.tsx";

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
    <div className="main-card-wrapper">
        <div className="logged-in-section">
          <div className="logged-in-message">✅ Successfully authenticated!</div>
          <h2 className="profile-section-title">Your Profile</h2>
          <div className="profile-card">
              <Profile />
          </div>
          <LogoutButton />
      </div>
    </div>
  )
}
