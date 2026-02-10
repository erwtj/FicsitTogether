import { createFileRoute } from '@tanstack/react-router';
import LoginButton from '../components/buttons/LoginButton';

export const Route = createFileRoute('/login')({
    component: LoginComponent,
    staticData : {
        title: "Ficsit Together | Login",
        showNav: false,
    }
});

function LoginComponent() {
    return (
        <div className="login-page">
            <div className="main-card-wrapper">
                <img
                    src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
                    alt="Auth0 Logo"
                    className="auth0-logo"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <h1>Welcome to Ficsit Together</h1>
                <div className="action-card">
                    <p className="action-text">Get started by signing in to your account</p>
                    <LoginButton />
                </div>
            </div>
        </div>
    );
}