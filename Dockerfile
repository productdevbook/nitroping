FROM node:22-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@10.30.0

# Copy app package files
COPY app/package.json app/pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY app .

FROM base AS build

ARG DATABASE_URL
ARG JWT_SECRET
ARG ENCRYPTION_KEY
ARG WEBHOOK_SECRET
ARG AUTO_MIGRATE

ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET
ENV AUTO_MIGRATE=$AUTO_MIGRATE

RUN pnpm run build

FROM base AS dev

EXPOSE 3100

CMD ["pnpm", "run", "dev"]

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/.output /app

EXPOSE 3100

CMD ["node", "/app/server/index.mjs"]
