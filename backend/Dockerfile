# Build context must be the monorepo root:
#   docker build -f backend/Dockerfile .

# ── Stage 1: build deps ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY dtolib/package.json   ./dtolib/
COPY ficlib/package.json   ./ficlib/
COPY frontend/package.json ./frontend/
COPY backend/package.json  ./backend/

# Install all workspace deps with exact locked versions
RUN npm ci

# Copy source for the local libs and build them
COPY dtolib/ ./dtolib/
COPY ficlib/  ./ficlib/

# tsc is not in lib package.json deps - use the one installed in the workspace
RUN npm run build --workspace dtolib
RUN npm run build --workspace ficlib

# Copy backend source
COPY backend/ ./backend/

# ── Stage 2: lean runtime image ───────────────────────────────────────────────
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Copy only what the backend needs at runtime
COPY --from=builder /workspace/node_modules        ./node_modules
COPY --from=builder /workspace/dtolib/dist         ./dtolib/dist/
COPY --from=builder /workspace/dtolib/package.json ./dtolib/
COPY --from=builder /workspace/ficlib/dist         ./ficlib/dist/
COPY --from=builder /workspace/ficlib/package.json ./ficlib/
COPY --from=builder /workspace/backend/src         ./backend/src/
COPY --from=builder /workspace/backend/package.json ./backend/
COPY --from=builder /workspace/backend/tsconfig.json ./backend/

WORKDIR /app/backend

EXPOSE 3000

CMD ["../node_modules/.bin/tsx", "src/server.ts"]

