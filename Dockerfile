FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files and local SDK workspace
COPY package.json bun.lock ./
COPY sdk ./sdk

# Build SDK first
RUN cd sdk && bun install && bun run build && cd ..

# Install main app dependencies
RUN bun install --frozen-lockfile

COPY . .

FROM base AS build

# Build arguments for environment variables needed during build
ARG DATABASE_URL
ARG JWT_SECRET
ARG ENCRYPTION_KEY
ARG WEBHOOK_SECRET
ARG AUTO_MIGRATE

# Set environment variables for build
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET
ENV AUTO_MIGRATE=$AUTO_MIGRATE

RUN bun run build

FROM base AS dev

EXPOSE 3000

CMD ["bun", "run", "dev"]

FROM oven/bun:1-alpine AS production

WORKDIR /app

COPY --from=build /app/.output /app

EXPOSE 3000

CMD ["bun", "run", "/app/server/index.mjs"]
