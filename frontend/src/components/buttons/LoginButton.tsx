import {Route} from "../../routes/__root.tsx";
import './buttons.css';
import Button from 'react-bootstrap/Button';

interface LoginButtonProps {
    className?: string;
}

const LoginButton = ({className}: LoginButtonProps) => {
    const { auth } = Route.useRouteContext();

    if (!auth) {
        return null;
    }

    const login = auth.login
    return (
        <Button variant="primary" size="lg" className={className} onClick={() => login()}>
            Login
        </Button>
    );
};

export default LoginButton;