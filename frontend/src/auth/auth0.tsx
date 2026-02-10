import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { createContext, useContext } from 'react'
import { User } from '@auth0/auth0-react'

export interface Auth0ContextType  {
    isAuthenticated: boolean
    user: User | undefined
    login: () => void
    logout: () => void
    isLoading: boolean
    getAccessTokenSilently?: () => Promise<string>
}

const Auth0Context = createContext<Auth0ContextType | undefined>(undefined)

function Auth0ContextProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, loginWithRedirect, logout, isLoading, getAccessTokenSilently } = useAuth0()

    const contextValue = {
        isAuthenticated,
        user,
        login: () => loginWithRedirect(),
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
        isLoading,
        getAccessTokenSilently: getAccessTokenSilently
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
                audience: import.meta.env.VITE_AUTH0_AUDIENCE
            }}

            // TODO: Unsafe, only use in dev
            useRefreshTokens={import.meta.env.DEV}
            cacheLocation={import.meta.env.DEV ? "localstorage" : "memory"}
        >
            <Auth0ContextProvider>{children}</Auth0ContextProvider>
        </Auth0Provider>

    )
}

export function useAuth0Context() {
    const context = useContext(Auth0Context)
    if (context === undefined) {
        throw new Error('useAuth0Context must be used within Auth0Wrapper')
    }
    return context
}
