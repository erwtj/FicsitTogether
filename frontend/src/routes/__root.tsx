import { createRootRouteWithContext, redirect, Outlet, useRouterState} from '@tanstack/react-router';
import {type RouterContext} from '../router';
import {useEffect} from "react";

export const Route = createRootRouteWithContext<RouterContext>()({
    beforeLoad: ({context, location}) => {
        if (location.pathname === '/login') {
            return;
        }

        if (!context.auth || !context.auth.isAuthenticated) {
            throw redirect({
                to: '/login',
                replace: true,
            });
        }

        if (context.auth && context.auth.isAuthenticated && location.pathname !== '/home') {
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
            {showNav && <></>}
            <Outlet/>
        </div>
    );
}
