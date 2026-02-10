import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {Auth0Wrapper} from "./auth/auth0.tsx";
import App from "./App.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Auth0Wrapper>
            <App />
        </Auth0Wrapper>
    </StrictMode>,
)


