import { createRootRouteWithContext, redirect, Outlet, useRouterState} from '@tanstack/react-router';
import {type RouterContext} from '../router';
import {useEffect} from "react";
import NavHeader from "../components/NavHeader.tsx";
import {z} from 'zod';

const rootSearchSchema = z.object({
    error: z.string().optional(),
    error_description: z.string().optional(),
}).passthrough();

export const Route = createRootRouteWithContext<RouterContext>()({
    validateSearch: rootSearchSchema,
    beforeLoad: ({context, location, search, matches}) => {
        // Auth0 error callback, redirect to login so the error is shown there
        if (search.error) {
            if (location.pathname !== '/login') {
                throw redirect({
                    to: '/login',
                    search: { error: search.error, error_description: search.error_description },
                    replace: true,
                });
            }
            return;
        }

        if (location.pathname === '/') {
            if (context.auth && context.auth.isAuthenticated) {
                throw redirect({
                    to: '/home',
                    replace: true,
                });
            } else {
                throw redirect({
                    to: '/login',
                    replace: true,
                });
            }
        }

        // If any matched route requires auth and the user isn't logged in, redirect to login
        const requiresAuth = matches.some((match) => match.staticData?.requireAuth);
        if (requiresAuth && !context.auth?.isAuthenticated) {
            throw redirect({
                to: '/login',
                replace: true,
            });
        }
    },
    component: RootComponent,
    staticData: {
        showNav: false,
        title: 'Ficsit Together',
        requireAuth: false,
    }
});

function RootComponent() {
    const state = useRouterState();
    const showNav = state.matches.some((match) => {
        return match.staticData?.showNav === true;
    });

    useEffect(() => {
        document.title = state.matches[1]?.staticData?.title || 'Ficsit Together';
    }, [state]);

    return (
        <div className="d-flex flex-column min-vh-100 m-0 flex-grow-1">
            {showNav && <NavHeader/>}
            <Outlet/>
        </div>
    );
}
