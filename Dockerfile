FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/be/src ./apps/be/src
COPY --from=builder /app/apps/ws ./apps/ws
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/be/package.json ./apps/be/package.json
COPY --from=builder /app/apps/ws/package.json ./apps/ws/package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000 3001 3002
CMD ["sh"]
