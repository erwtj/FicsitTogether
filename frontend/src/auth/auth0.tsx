import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { Auth0Context } from './useAuth0Context'
import { User } from '@auth0/auth0-react'

export interface Auth0ContextType  {
    isAuthenticated: boolean
    user: User | undefined
    login: () => void
    logout: () => void
    isLoading: boolean
    getAccessTokenSilently: () => Promise<string>
}


function Auth0ContextProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, loginWithRedirect, logout, isLoading, getAccessTokenSilently } = useAuth0()

    const contextValue = {
        isAuthenticated,
        user,
        login: () => loginWithRedirect(),
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
        isLoading,
        getAccessTokenSilently
    }

    return (
        <Auth0Context.Provider value={contextValue}>
            {children}
        </Auth0Context.Provider>
    )
}


export function Auth0Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: 'openid profile email offline_access'
            }}

            useRefreshTokens={true}
            cacheLocation={"localstorage"}
        >
            <Auth0ContextProvider>{children}</Auth0ContextProvider>
        </Auth0Provider>

    )
}

