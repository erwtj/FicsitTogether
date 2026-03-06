import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import type {Auth0ContextType} from './auth/auth0.tsx';
import {NotFoundComponent} from "./components/404.tsx";
import {ErrorComponent} from "./components/Error.tsx";

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
    defaultPreload: false,
    defaultNotFoundComponent: NotFoundComponent,
    defaultErrorComponent: ErrorComponent,
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