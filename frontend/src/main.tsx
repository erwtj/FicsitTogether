import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {Auth0Wrapper} from "./auth/auth0.tsx";
import App from "./App.tsx";
import {ClientSettingsProvider} from "./context/ClientSettingsContext.tsx";
import { init } from "@plausible-analytics/tracker";

if (import.meta.env.VITE_PLAUSIBLE_DOMAIN && import.meta.env.VITE_PLAUSIBLE_ENDPOINT) {
    init({
        domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
        endpoint: import.meta.env.VITE_PLAUSIBLE_ENDPOINT,
        fileDownloads: true,
    })
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Auth0Wrapper>
            <ClientSettingsProvider>
                <App />
            </ClientSettingsProvider>
        </Auth0Wrapper>
    </StrictMode>,
)


