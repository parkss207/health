FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base
COPY --from=install /app/node_modules ./node_modules
COPY src ./src

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "src/index.ts"]
