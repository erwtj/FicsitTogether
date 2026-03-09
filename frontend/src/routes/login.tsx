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

const img_id = Math.floor(Math.random() * 3); // Make sure to update '3' when adding updating backgrounds
const random_img = `/media/login-backgrounds/${img_id}.webp`;

function LoginComponent() {
    return (
        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-black">
            <div id="background-img" className="h-100 w-100 position-absolute" style={{backgroundImage: `url(${random_img})`}}/>
            <Card bg='dark' id="login-card" className="mx-3 pb-3 pt-1 px-3">
                <Card.Body className="text-center">
                    <Card.Img className="mb-3" src='/media/Ficsit_logo.webp'/>
                    <Card.Title className="fs-2">Welcome to Ficsit Together</Card.Title>
                    <Card.Text className="mb-4">
                        Get started by signing in to your account
                    </Card.Text>
                    <LoginButton className="w-75"/>
                </Card.Body>
            </Card>
        </div>
    );
}
