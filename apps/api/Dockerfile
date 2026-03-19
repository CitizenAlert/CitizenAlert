# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally once
RUN npm install -g pnpm

# Copy workspace config and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Rebuild monorepo symlinks and build application
RUN pnpm install --frozen-lockfile && pnpm --filter api build

# Production stage - minimal alpine image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config and package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies and prune cache
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copy runtime artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/src/templates ./apps/api/dist/templates

EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main"]
