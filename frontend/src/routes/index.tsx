import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
    beforeLoad: ({ context }) => {
        console.log(`[INDEX DEBUG] beforeLoad - isLoading: ${context.auth?.isLoading}, isAuthenticated: ${context.auth?.isAuthenticated}`);
        
        if (context.auth && context.auth.isAuthenticated) {
            console.log(`[INDEX DEBUG] Redirecting to /home`);
            throw redirect({ to: '/home', replace: true });
        } else {
            console.log(`[INDEX DEBUG] Redirecting to /login`);
            throw redirect({ to: '/login', replace: true });
        }
    },
    staticData: {
        title: "Ficsit Together",
        showNav: false,
        requireAuth: false,
    },
    component: IndexComponent
});

function IndexComponent() {
    return <div className="text-center">
        <h2 className="mt-5">This is awkward</h2>
        <p className="fs-5">We should have redirected you by now...</p>
        <p className="fs-5">Please create <a className="clickable-link default-purple" href="https://github.com/erwtj/FicsitTogether/issues">an issue on GitHub</a>!</p>
        <p className="fs-5">To go back to the regular website, refresh your browser page.</p>
    </div>
}
