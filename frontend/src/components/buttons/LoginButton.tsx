import {Route} from "../../routes/__root.tsx";
import './buttons.css';
import Button from 'react-bootstrap/Button';

const LoginButton = () => {
    const { auth } = Route.useRouteContext();

    if (!auth) {
        return null;
    }

    const login = auth.login
    return (
        <Button variant="primary" size="lg" onClick={() => login()}>
            Login
        </Button>
    );
};

export default LoginButton;