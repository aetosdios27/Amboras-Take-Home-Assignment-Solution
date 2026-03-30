FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
ENV BUN_CONFIG_REGISTRY="https://registry.npmjs.org"
RUN bun install --frozen-lockfile || bun install

COPY . .
RUN bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["bun", "run", "dist/main.js"]
