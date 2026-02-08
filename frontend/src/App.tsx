import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './components/buttons/LoginButton';
import LogoutButton from './components/buttons/LogoutButton';
import Profile from './components/Profile';
import api from "./api/axiosInstance.ts";
import {useState} from "react";

function TestButton() {
    const { getAccessTokenSilently } = useAuth0();
    const [result, setResult] = useState<string>("");
    
    const onClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        const token = await getAccessTokenSilently();
        const response = await api.get("projects/hello", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        setResult(response.data.message);
    }
    
    return (<div>
        <button onClick={onClick}>Test hello!</button>    
        <p>Result: <span>{result}</span></p>
    </div>);
}

function App() {
    const { isAuthenticated, isLoading, error } = useAuth0();

    if (isLoading) {
        return (
            <div className="app-container">
                <div className="loading-state">
                    <div className="loading-text">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="error-state">
                    <div className="error-title">Oops!</div>
                    <div className="error-message">Something went wrong</div>
                    <div className="error-sub-message">{error.message}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <div className="main-card-wrapper">
                <img
                    src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png"
                    alt="Auth0 Logo"
                    className="auth0-logo"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <h1 className="main-title">Welcome to Sample0</h1>

                {isAuthenticated ? (
                    <div className="logged-in-section">
                        <div className="logged-in-message">✅ Successfully authenticated!</div>
                        <h2 className="profile-section-title">Your Profile</h2>
                        <div className="profile-card">
                            <Profile />
                        </div>
                        <LogoutButton />
                        
                        <TestButton />
                    </div>
                ) : (
                    <div className="action-card">
                        <p className="action-text">Get started by signing in to your account</p>
                        <LoginButton />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;