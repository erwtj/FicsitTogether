import { createFileRoute, Link, redirect} from '@tanstack/react-router';
import LoginButton from '../components/buttons/LoginButton';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import './login.tsx.css'
import {z} from 'zod';
import {useEffect, useState} from 'react';

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
    },
    head: () => ({
        meta: [
            {
                name: 'description',
                content: 'Sign in to Ficsit Together and start planning your Satisfactory factory with friends. Create an account to access collaborative factory planning tools and real-time multiplayer features.'
            },
            {
                name: 'keywords',
                content: 'Ficsit Together login, Satisfactory planner sign in, factory planner account, Satisfactory tools login'
            },
            {
                property: 'og:title',
                content: 'Login - Ficsit Together'
            },
            {
                property: 'og:description',
                content: 'Sign in to Ficsit Together and start planning your Satisfactory factory with friends in real-time.'
            },
            {
                property: 'og:type',
                content: 'website'
            },
            {
                property: 'og:url',
                content: 'https://ficsit-together.com/login'
            },
            {
                name: 'twitter:card',
                content: 'summary'
            },
            {
                name: 'twitter:title',
                content: 'Login - Ficsit Together'
            },
            {
                name: 'twitter:description',
                content: 'Sign in to Ficsit Together and start planning your Satisfactory factory with friends.'
            },
            {
                name: 'robots',
                content: 'noindex, follow'
            }
        ]
    })
});

const img_id = Math.floor(Math.random() * 3); // Make sure to update '3' when adding updating backgrounds
const random_img = `/media/login-backgrounds/${img_id}.webp`;

function LoginComponent() {
    const { error, error_description } = Route.useSearch();
    const [authNotice, setAuthNotice] = useState<string | null>(null);

    useEffect(() => {
        const notice = window.sessionStorage.getItem('auth_notice');
        if (notice === 'session_expired') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAuthNotice('Your session expired. Please sign in again.');
            window.sessionStorage.removeItem('auth_notice');
        }
    }, []);

    return (
        <main className="w-100 h-100 d-flex align-items-center justify-content-center bg-black">
            <div id="background-img" className="h-100 w-100 position-absolute" style={{backgroundImage: `url(${random_img})`}} role="presentation" aria-hidden="true"/>
            <Card bg='dark' id="login-card" className="mx-3 pb-3 pt-1 px-3" as="section" aria-labelledby="login-title">
                <Card.Body className="text-center">
                    <Card.Img className="mb-3" src='/media/Ficsit_logo.webp' alt="Ficsit Together logo"/>
                    <Card.Title id="login-title" className="fs-2" as="h1">Welcome to Ficsit Together</Card.Title>
                    <p>Don't know what it is? Check out the <Link to={"/about"} className="clickable-link default-purple">about</Link> page!</p>
                    {(error || authNotice) ? (
                        <Alert variant="warning" className="text-start mt-2 mb-3 py-2" role="alert">
                            {authNotice ? (
                                <p className="mb-0 small">{authNotice}</p>
                            ) : (
                                error_description && <p className="mb-0 small">{decodeURIComponent(error_description)}</p>
                            )}
                        </Alert>
                    ) : (
                        <Card.Text className="mb-4">
                            Get started by signing in to your account
                        </Card.Text>
                    )}
                    <LoginButton className="w-75" prompt={error ? 'login' : undefined}/>
                </Card.Body>
            </Card>
        </main>
    );
}
