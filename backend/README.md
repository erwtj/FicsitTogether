# FicsitTogether backend
This is a basic Node backend that manages the sqlite database and websocket connections coming from the frontend. 

## Code layout
This project follows a horizontal layout containing multiple layers: controllers (API endpoints), repositories (database connection) and sockets (websocket connection) intercepted by various middleware.

## Login
Login and session management is handled via [OAuth 2.0](https://oauth.net/2/) using [Auth0](https://auth0.com/).

## Database layout


## How to build
``docker build --platform=linux/arm64 -t {username}/factory-server:latest .`` \
``docker push {username}/factory-server:latest``
> You can choose whatever platform, linux/arm64 was chosen as an example for hosting on a raspi

## Volumes, Ports and Environment Variables
### Volumes
- /usr/src/app/secret.pem: SSL certificate for HTTPS
- /usr/src/app/secret.key: SSL key for HTTPS
- /usr/src/app/data: Data directory for the server's SQL database

### Environment Variables
#### API
- API_PORT: Port to run the API server on
- WS_PORT: Port to run the WebSocket server on
- CORS_ORIGIN: CORS origin to allow
- HTTPS: Whether to run the server with HTTPS (true/false)

#### AUTH0
- AUTH0_AUDIENCE: AUTH0 API Audience
- AUTH0_DOMAIN: AUTH0 Application Domain
- AUTH0_CLIENT_ID: AUTH0 Application Client ID
