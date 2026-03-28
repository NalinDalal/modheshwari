# syntax=docker/dockerfile:1
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/
COPY apps/be/package.json apps/be/
COPY apps/ws/package.json apps/ws/
COPY packages/*/package.json packages/*/
RUN npm install

# Build all apps
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/package.json ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /apps/be/dist ./apps/be/dist
COPY --from=builder /apps/ws/dist ./apps/ws/dist

# Create startup scripts
RUN echo '#!/bin/bash' > start-be.sh && \
    echo 'cd /app/apps/be && bun run src/index.ts' >> start-be.sh && \
    chmod +x start-be.sh

RUN echo '#!/bin/bash' > start-ws.sh && \
    echo 'cd /app/apps/ws && bun run src/index.ts' >> start-ws.sh && \
    chmod +x start-ws.sh

EXPOSE 3001 3002
CMD ["sh", "-c", "cd /app/apps/be && bun run src/index.ts"]
