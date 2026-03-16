# Build context must be the monorepo root:
#   docker build -f frontend/Dockerfile .

# ── Stage 1: build Vite static site ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY dtolib/package.json  ./dtolib/
COPY ficlib/package.json  ./ficlib/
COPY frontend/package.json ./frontend/
COPY backend/package.json  ./backend/

# Install all workspace deps with exact locked versions (prevents zod v4 being pulled in)
RUN npm ci

# Copy source for the local libs and build them
COPY dtolib/  ./dtolib/
COPY ficlib/   ./ficlib/

# tsc is not in lib package.json deps - use the one installed in the workspace
RUN npm run build --workspace dtolib
RUN npm run build --workspace ficlib

# Copy frontend source and build
COPY frontend/ ./frontend/

# Vite bakes env vars into the bundle at build time — pass these via --build-arg
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN \
    VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID \
    VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE

RUN npm run build --workspace frontend

# ── Stage 2: nginx serving the static site ────────────────────────────────────
FROM nginx:stable-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /workspace/frontend/dist /usr/share/nginx/html

# SPA config: HTTPS on 443, redirect HTTP to HTTPS.
# Certs are NOT baked into the image — mount them at runtime:
#   -v /path/to/cert.pem:/etc/nginx/certs/cert.pem:ro
#   -v /path/to/key.pem:/etc/nginx/certs/key.pem:ro
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    return 301 https://$host$request_uri;\n\
}\n\
server {\n\
    listen 443 ssl;\n\
    server_name _;\n\
    ssl_certificate     /etc/nginx/certs/cert.pem;\n\
    ssl_certificate_key /etc/nginx/certs/key.pem;\n\
    ssl_protocols       TLSv1.2 TLSv1.3;\n\
    ssl_ciphers         HIGH:!aNULL:!MD5;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    server_tokens off;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;\n\
    location ~* \\.(?:ico|css|js|gif|webp|png|jpg|jpeg|svg|woff2?|ttf|eot)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "view, immutable";\n\
        try_files $uri =404;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
