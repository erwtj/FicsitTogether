import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { Auth0Context } from './useAuth0Context'
import { User } from '@auth0/auth0-react'

const AUTH_ERROR_CODES = new Set([
    'invalid_grant',
    'login_required',
    'consent_required',
    'missing_refresh_token',
    'invalid_refresh_token',
])

function isRecoverableAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false
    }

    const authError = error as { error?: string; message?: string }
    const code = authError.error?.toLowerCase()
    const message = authError.message?.toLowerCase() ?? ''

    return Boolean(
        (code && AUTH_ERROR_CODES.has(code)) ||
        message.includes('invalid refresh token') ||
        message.includes('unknown or invalid refresh token') ||
        message.includes('login required') ||
        message.includes('missing refresh token')
    )
}

export interface Auth0ContextType  {
    isAuthenticated: boolean
    user: User | undefined
    login: (prompt?: 'login' | 'none' | 'consent' | 'select_account') => void
    logout: () => void
    isLoading: boolean
    getAccessTokenSilently: () => Promise<string>
}


function Auth0ContextProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user, loginWithRedirect, logout, isLoading, getAccessTokenSilently } = useAuth0()

    const safeGetAccessTokenSilently = async (): Promise<string> => {
        try {
            return await getAccessTokenSilently()
        } catch (error) {
            if (isRecoverableAuthError(error)) {
                window.sessionStorage.setItem('auth_notice', 'session_expired')

                await logout({
                    logoutParams: {
                        returnTo: `${window.location.origin}`,
                    },
                })

                return new Promise<string>(() => {
                    // Unresolved by design: browser navigation is already in progress.
                })
            }

            throw error
        }
    }

    const contextValue = {
        isAuthenticated,
        user,
        login: (prompt?: 'login' | 'none' | 'consent' | 'select_account') => loginWithRedirect(prompt ? { authorizationParams: { prompt } } : undefined),
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
        isLoading,
        getAccessTokenSilently: safeGetAccessTokenSilently
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

