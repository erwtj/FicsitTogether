import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router';
import {router} from './router';
import {Auth0Wrapper, useAuth0Context} from "./auth/auth0.tsx";

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
    const auth = useAuth0Context()

    if (auth.isLoading) {
        return (
            <div className="app-container">
                <div className="loading-state">
                    <div className="loading-text">Loading...</div>
                </div>
            </div>
        );
    }

    return <RouterProvider router={router} context={{auth}}/>;
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Auth0Wrapper>
            <InnerApp />
        </Auth0Wrapper>
    </StrictMode>,
)


