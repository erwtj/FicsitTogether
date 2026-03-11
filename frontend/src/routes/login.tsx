import { createFileRoute, redirect} from '@tanstack/react-router';
import LoginButton from '../components/buttons/LoginButton';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import './login.tsx.css'
import {z} from 'zod';

const loginSearchSchema = z.object({
    error: z.string().optional(),
    error_description: z.string().optional(),
});

export const Route = createFileRoute('/login')({
    validateSearch: loginSearchSchema,
    beforeLoad: ({context}) => {
        if (context.auth && context.auth.isAuthenticated) {
            throw redirect({to: '/home', replace: true});
        }
    },

    component: LoginComponent,
    staticData : {
        title: "Ficsit Together | Login",
        showNav: false,
        requireAuth: false,
    }
});

const img_id = Math.floor(Math.random() * 3); // Make sure to update '3' when adding updating backgrounds
const random_img = `/media/login-backgrounds/${img_id}.webp`;

function LoginComponent() {
    const { error, error_description } = Route.useSearch();

    return (
        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-black">
            <div id="background-img" className="h-100 w-100 position-absolute" style={{backgroundImage: `url(${random_img})`}}/>
            <Card bg='dark' id="login-card" className="mx-3 pb-3 pt-1 px-3">
                <Card.Body className="text-center">
                    <Card.Img className="mb-3" src='/media/Ficsit_logo.webp'/>
                    <Card.Title className="fs-2">Welcome to Ficsit Together</Card.Title>
                    {error ? (
                        <Alert variant="warning" className="text-start mt-2 mb-3 py-2">
                            {error_description && <p className="mb-0 small">{decodeURIComponent(error_description)}</p>}
                        </Alert>
                    ) : (
                        <Card.Text className="mb-4">
                            Get started by signing in to your account
                        </Card.Text>
                    )}
                    <LoginButton className="w-75 slooping" prompt={error ? 'login' : undefined}/>
                </Card.Body>
            </Card>
        </div>
    );
}
