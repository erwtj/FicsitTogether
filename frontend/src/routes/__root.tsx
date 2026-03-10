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
    beforeLoad: ({context, location, search}) => {
        // Auth0 error callback — redirect to login so the error is shown there
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

        if (location.pathname === '/login') {
            return;
        }

        if (!context.auth || !context.auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                replace: true,
            });
        }

        if (context.auth && context.auth.isAuthenticated && location.pathname === '/') {
            throw redirect({
                to: '/home',
                replace: true,
            })
        }
    },
    component: RootComponent,
    staticData: {
        showNav: false,
        title: 'Ficsit Together',
    }
});

function RootComponent() {
    const state = useRouterState();
    const showNav = state.matches.some((match) => {
        return match.staticData?.showNav === true;
    });

    useEffect(() => {
        document.title = state.matches[1]?.staticData?.title || 'Satisfactory Charter';
    }, [state]);

    return (
        <div className="d-flex flex-column min-vh-100 m-0 flex-grow-1">
            {showNav && <NavHeader/>}
            <Outlet/>
        </div>
    );
}
