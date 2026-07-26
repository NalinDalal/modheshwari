FROM oven/bun:1.3.11 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/be/package.json ./apps/be/package.json
COPY apps/ws/package.json ./apps/ws/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/db/schema.prisma ./packages/db/schema.prisma
RUN bun install

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
