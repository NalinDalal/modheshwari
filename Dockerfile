# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# ============================================
# DEPS - Install all dependencies
# ============================================
FROM base AS deps
COPY package.json bun.lock* ./
COPY apps/web/package.json apps/web/
COPY apps/be/package.json apps/be/
COPY apps/ws/package.json apps/ws/
COPY packages/*/package.json packages/*/
RUN npm install

# ============================================
# BUILDER - Build all applications
# ============================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build all apps
RUN npm run build

# ============================================
# PRODUCTION RUNNER
# ============================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/package.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/tsconfig.json ./

# Default command - starts backend
# Individual services override this in docker-compose
CMD ["bun", "run", "apps/be/src/index.ts"]
