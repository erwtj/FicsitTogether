import type { ErrorComponentProps } from "@tanstack/react-router";

export function ErrorComponent({error}: ErrorComponentProps) {
    return (
        <div className="d-flex align-items-center justify-content-center px-2" style={{marginTop: "10vh"}}>
            <div className="text-center">
                <h1 className="display-1 fw-bold">Error</h1>
                <p className="fs-2 fw-medium mt-4 mb-0">We did not handle this error, oops.</p>
                <p className="fs-5">If you think this is important, open an issue in <a href="https://github.com/erwtj/FicsitTogether" target="_blank" className="clickable-link">GitHub</a></p>
                <p className="fs-5 mt-4 mb-4">Error message: <span className="text-warning">{error.message}</span></p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
            </div>
        </div>
    );
}