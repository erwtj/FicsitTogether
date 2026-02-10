import { createFileRoute, redirect} from '@tanstack/react-router';
import LoginButton from '../components/buttons/LoginButton';
import Card from 'react-bootstrap/Card';
import './login.tsx.css'
export const Route = createFileRoute('/login')({
    beforeLoad: ({context}) => {
        if (context.auth && context.auth.isAuthenticated) {
            throw redirect({to: '/home', replace: true});
        }
    },

    component: LoginComponent,
    staticData : {
        title: "Ficsit Together | Login",
        showNav: false,
    }
});

function LoginComponent() {
    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center noselect nodrag">
            <Card style={{ width: '30rem'}} bg='dark' className="login-card lifted">
                <Card.Body className="text-center">
                    <Card.Img className="mb-3" src='public/media/Ficsit_logo.webp' draggable={false}/>
                    <Card.Title className="fs-2">Welcome to Ficsit Together</Card.Title>
                    <Card.Text  className="m-3">
                        Get started by signing in to your account
                    </Card.Text>
                    <LoginButton/>
                </Card.Body>
            </Card>
        </div>
    );
}
