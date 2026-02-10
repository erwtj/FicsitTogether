import {Route} from "../../routes/__root.tsx";
import './buttons.css';

const LogoutButton = () => {
    const { auth } =  Route.useRouteContext()

    if (!auth) {
        return null; // or some fallback UI
    }

    const logout = auth.logout
    return (
        <button
            onClick={() => logout()}
            className="button logout"
        >
            Log Out
        </button>
    );
};

export default LogoutButton;