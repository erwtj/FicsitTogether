import {useContext, createContext} from 'react'
import {type Auth0ContextType} from './auth0'

export const Auth0Context = createContext<Auth0ContextType | undefined>(undefined)

export function useAuth0Context() {
    const context = useContext(Auth0Context)
    if (context === undefined) {
        throw new Error('useAuth0Context must be used within Auth0Wrapper')
    }
    return context
}