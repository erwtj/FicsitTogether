import { Link } from '@tanstack/react-router'

export function NotFoundComponent() {
  return <div className="d-flex align-items-center justify-content-center px-2" style={{marginTop: "10vh"}}>
      <div className="text-center">
          <h1 className="display-1 fw-bold">404</h1>
          <p className="fs-2 fw-medium mt-4">Oops! Page not found</p>
          <p className="mt-4 mb-5">The page you're looking for doesn't exist.</p>
          <Link to="/home" className="btn btn-primary fw-semibold rounded px-4 py-2 custom-btn">
              Go Home
          </Link>
      </div>
  </div>
}
