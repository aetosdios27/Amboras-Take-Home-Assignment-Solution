FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
ENV BUN_CONFIG_REGISTRY="https://registry.npmjs.org"
RUN bun install --frozen-lockfile || bun install

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["bun", "run", "start"]
