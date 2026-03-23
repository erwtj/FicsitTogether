# FicsitTogether

[![Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-gray?logo=buy-me-a-coffee&logoColor=white&style=flat-square)](https://www.buymeacoffee.com/ikno).

A collaborative factory planner web application for Satisfactory. FicsitTogether allows players to design and plan their in-game factories together in real-time with a visual, node-based editor.

## Features

- **Real-time Collaboration** - Multiple users can edit the same factory plan simultaneously with automatic synchronization
- **Visual Node Editor** - Design production lines using connected nodes for recipes, resource spawners, and output sinks
- **Directory Organization** - Organize projects into nested folders for easy management
- **Sharing** - Share directories with specific users or create public view-only links
- **Export/Import** - Download and upload projects as JSON files
- **Factory Calculations** - Automatic throughput calculations for production lines
- **User Authentication** - Secure user accounts via Auth0

## Project Structure

This is a monorepo containing four main packages:

### `frontend/`
The React-based web application that provides the user interface. Built with:
- React 19 and Vite
- TanStack Router for routing
- React Flow (@xyflow/react) for the node-based editor
- Auth0 for authentication
- Yjs for real-time collaboration
- Bootstrap for styling

### `backend/`
The Node.js Express server that handles API requests and WebSocket connections. Features:
- RESTful API for projects, directories, and sharing
- WebSocket server for real-time collaboration using Yjs
- PostgreSQL database for data persistence
- Auth0 JWT authentication
- Express rate limiting for security

### `dtolib/`
Shared TypeScript Data Transfer Object (DTO) library used by both frontend and backend. Contains type definitions and validation schemas for API communication.

### `ficlib/`
Satisfactory game data library containing:
- Recipe definitions
- Building specifications
- Item and resource data
- Game mechanics constants

This library provides the foundational data for factory planning calculations.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- PostgreSQL database (for backend)
- Docker (optional, for containerized deployment)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/erwtj/FicsitTogether
cd FicsitTogether
```

### 2. Install Dependencies

This project uses npm workspaces. Install all dependencies from the root:

```bash
npm install
```

This will install dependencies for all packages (frontend, backend, dtolib, and ficlib).

### 3. Environment Variables

#### Backend Environment Variables

Create or update `backend/.env` with the following:

```env
API_PORT=2053
CORS_ORIGIN=http://localhost:5173
HTTPS=false

AUTH0_AUDIENCE=your-auth0-audience
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-auth0-client-id

NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/ficsitdb
```

#### Frontend Environment Variables

Create or update `frontend/.env.development` with the following:

```env
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-audience
VITE_API_URL=http://localhost:2053
VITE_WS_URL=ws://localhost:2053
```

Replace `your-auth0-{audience | domain | client-id}` with your actual Auth0 credentials. You'll need to set up an Auth0 application to get these values.

### 4. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
createdb ficsitdb
```

The backend will handle schema initialization on first run.

### 5. Auth0 Setup
Auth0 needs to be configured to require usernames during signup. Social logins are not supported.
The username and email need to be attached to the JWT token as claims. This can be done by creating a rule in Auth0 with the following code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
    // This action adds the authenticated user's email address and username to the access token.
    const namespace = event.secrets.NAMESPACE;

    const prefix = namespace.endsWith('/') ? namespace : namespace + '/';

    api.accessToken.setCustomClaim(prefix + 'email', event.user.email);
    api.accessToken.setCustomClaim(prefix + 'username', event.user.username);
};
```

This should be configured as a Post-Login Action in your Auth0 dashboard. Make sure to set the appropriate secrets for `NAMESPACE` in your Auth0 tenant.

## Development

### Build Shared Libraries

Before running the frontend or backend, build the shared libraries:

```bash
npm run build:lib
```

This builds both `ficlib` and `dtolib`.

### Run the Backend

From the root directory:

```bash
npm start --workspace backend
```

Or from the backend directory:

```bash
cd backend
npm start
```

The backend API will be available at `http://localhost:2053`.

### Run the Frontend

From the root directory:

```bash
npm run dev --workspace frontend
```

Or from the frontend directory:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Building for Production

### Build All Packages

From the root directory:

```bash
npm run build
```

This builds all workspaces (ficlib, dtolib, frontend, and backend).

### Docker Deployment

The project includes Dockerfiles for both frontend and backend. The deployment workflow builds and pushes Docker images:

#### Build Backend Docker Image

```bash
docker build -f backend/Dockerfile -t ficsit-together-backend:latest .
```

#### Build Frontend Docker Image

```bash
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL=https://your-api-url.com \
  --build-arg VITE_WS_URL=wss://your-websocket-url.com \
  --build-arg VITE_AUTH0_DOMAIN=your-auth0-domain \
  --build-arg VITE_AUTH0_CLIENT_ID=your-auth0-client-id \
  --build-arg VITE_AUTH0_AUDIENCE=your-auth0-audience \
  -t ficsit-together-frontend:latest .
```

## Scripts

### Root Package Scripts

- `npm run build` - Builds all workspaces
- `npm run build:lib` - Builds only ficlib and dtolib

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts

- `npm start` - Start the server with tsx

### Library Scripts (dtolib & ficlib)

- `npm run build` - Compile TypeScript to JavaScript

## CI/CD

The project uses GitHub Actions for automated deployment. On push to the `main` branch:

1. Builds Docker images for both frontend and backend
2. Pushes images to Docker Hub
3. Uses GitHub Actions cache for faster builds

See `.github/workflows/deploy.yml` for the full workflow configuration.

## Tech Stack

- **Frontend**: React, Vite, TanStack Router, React Flow, Bootstrap
- **Backend**: Node.js, Express, PostgreSQL, WebSocket (ws)
- **Real-time Collaboration**: Yjs, y-protocols
- **Authentication**: Auth0
- **Database**: PostgreSQL
- **Validation**: Zod
- **Language**: TypeScript

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full license text.

## Contributing

As of right now we do not support external contributions. You are free to open issues and suggest features, but we do not accept pull requests at this time.
