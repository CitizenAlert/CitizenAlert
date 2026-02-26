# Build stage - using full image for better build support
FROM node:20 AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Copy package files for all packages
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev for watch mode in dev container)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build application
WORKDIR /app
RUN pnpm --filter api build

# Production stage
FROM node:20

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# Copy package files for all packages
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy compiled bcrypt from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy public folder
COPY --from=builder /app/apps/api/public ./apps/api/public

# Expose port
EXPOSE 3000

# Set working directory and start application
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
