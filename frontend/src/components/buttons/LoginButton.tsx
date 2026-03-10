import {Route} from "../../routes/__root.tsx";
import './buttons.css';
import Button from 'react-bootstrap/Button';

interface LoginButtonProps {
    className?: string;
    prompt?: 'login' | 'none' | 'consent' | 'select_account';
}

const LoginButton = ({className, prompt}: LoginButtonProps) => {
    const { auth } = Route.useRouteContext();

    if (!auth) {
        return null;
    }

    const login = auth.login
    return (
        <Button variant="primary" size="lg" className={className} onClick={() => login(prompt)}>
            Login
        </Button>
    );
};

export default LoginButton;