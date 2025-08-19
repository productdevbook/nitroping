FROM node:22 AS base

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile

FROM base AS build

# Build arguments for environment variables needed during build
ARG DATABASE_URL
ARG JWT_SECRET
ARG ENCRYPTION_KEY
ARG WEBHOOK_SECRET

# Set environment variables for build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET

RUN pnpm run build

FROM base AS dev

EXPOSE 3000

CMD ["pnpm", "dev"]

FROM node:22-alpine3.22 AS production

WORKDIR /app

COPY --from=build /app/.output /app

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]

