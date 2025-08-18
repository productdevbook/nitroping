FROM node:22 AS base

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

FROM base AS build

ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm run build

FROM base AS dev

EXPOSE 3000

CMD ["pnpm", "dev"]

FROM node:22-alpine3.22 AS production

WORKDIR /app

COPY --from=build /app/.output /app

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]

