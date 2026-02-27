import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type {Auth0ContextType} from './auth/auth0.tsx';
import {NotFoundComponent} from "./components/404.tsx";

// Define the router context interface
export interface RouterContext {
    auth: Auth0ContextType | undefined;
}

export type staticRouterData = {
    title?: string;
    showNav?: boolean;
}

// Create the router instance
export const router = createRouter({
    routeTree,
    context: {
        auth: undefined,
    } as RouterContext,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFoundComponent,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
    interface StaticDataRouteOption {
        showNav: boolean,
        title: string,
    }
}