# WebSocket Dockerfile for Bun-based service
FROM oven/bun:1.2.19-alpine AS base

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Copy package files for all workspaces
COPY package.json bun.lock ./
COPY apps/ws/package.json ./apps/ws/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bun x prisma generate --schema=packages/db/schema.prisma

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

# Copy necessary files
COPY --from=builder /app/apps/ws ./apps/ws
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3002

# Run the WebSocket service
CMD ["bun", "run", "apps/ws/index.ts"]
