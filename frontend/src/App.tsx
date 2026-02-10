import { RouterProvider } from '@tanstack/react-router';
import {useAuth0Context} from "./auth/useAuth0Context.ts";
import {router} from "./router.tsx";

function App() {
    const auth = useAuth0Context()

    if (auth.isLoading) {
        return (
            <div className="app-container">
                <div className="loading-state">
                    <div className="loading-text">Loading...</div>
                </div>
            </div>
        );
    }

    return <RouterProvider router={router} context={{auth}}/>;
}

export default App;