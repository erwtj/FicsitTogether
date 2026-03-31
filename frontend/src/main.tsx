import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {Auth0Wrapper} from "./auth/auth0.tsx";
import App from "./App.tsx";
import {ClientSettingsProvider} from "./context/ClientSettingsContext.tsx";
import { init } from "@plausible-analytics/tracker";

// TODO: Move domain name to env
init({
    domain: 'ficsit-together.com',
    fileDownloads: true,
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Auth0Wrapper>
            <ClientSettingsProvider>
                <App />
            </ClientSettingsProvider>
        </Auth0Wrapper>
    </StrictMode>,
)


