import {Route} from "../../routes/__root.tsx";
import './buttons.css';

const LoginButton = () => {
    const { auth } = Route.useRouteContext();

    if (!auth) {
        return null;
    }

    const login = auth.login
    return (
        <button
            onClick={() => login()}
            className="button login"
        >
            Log In
        </button>
    );
};

export default LoginButton;