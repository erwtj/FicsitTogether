import { createRootRouteWithContext, redirect, Outlet, useRouterState} from '@tanstack/react-router';
import {type RouterContext} from '../router';
import {useEffect} from "react";
import NavHeader from "../components/nav/NavHeader.tsx";
import {z} from 'zod';
import PublicNavHeader from "../components/nav/PublicNavHeader.tsx";
import {useHelpModal} from "../hooks/useHelpModal.ts";
import {HelpModal} from "../components/modals/HelpModal/HelpModal.tsx";

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
  
    const auth = Route.useRouteContext().auth;

    const {show, details, onModalClose} = useHelpModal()

    useEffect(() => {
        document.title = state.matches[1]?.staticData?.title || 'Ficsit Together';
    }, [state]);
    
    useEffect(() => {
        if (state.matches[1]?.pathname?.includes('home') && auth && auth.isAuthenticated) {
            if (window.localStorage.getItem('firstTimeUser') === null) {
                window.localStorage.setItem('firstTimeUser', 'false');
                window.dispatchEvent(
                    new CustomEvent('openHelpModal', {detail: {openPage: 'welcome'}})
                );
            }
        }
    }, [auth, state.matches])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // ignore shortcuts with modifiers
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            // don't hijack typing inside inputs/contenteditable
            const target = e.target as HTMLElement | null;
            const isTypingTarget =
                target?.tagName === 'INPUT' ||
                target?.tagName === 'TEXTAREA' ||
                target?.isContentEditable;

            if (isTypingTarget) return;

            if (e.code === 'KeyH') {
                const path = state.matches[1]?.pathname || '';
                let openPage: string | undefined = undefined;
                
                if (path.includes('directories/') || path.includes('home')) {
                    openPage = 'directories';
                } else if (path.includes('edit/') || path.includes('projects/')) {
                    openPage = 'nodes';
                }
                
                window.dispatchEvent(
                    new CustomEvent('openHelpModal', {
                        detail: { openPage },
                    }),
                );
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div className="d-flex flex-column min-vh-100 m-0 flex-grow-1">
            {showNav && ((auth && auth.isAuthenticated) ? <NavHeader/> : <PublicNavHeader/>)}
            <HelpModal
                show={show}
                openPage={details?.openPage}
                onModalClose={onModalClose}
                key={details?.openPage}
            />
            <Outlet/>
        </div>
    );
}
