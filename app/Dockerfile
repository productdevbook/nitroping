FROM platformatic/node-caged:25.6.1-slim AS base

RUN npm install -g pnpm@latest

WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY sdk/ ./sdk/

RUN pnpm install --frozen-lockfile

COPY . .

FROM base AS build

ARG DATABASE_URL
ARG JWT_SECRET
ARG ENCRYPTION_KEY
ARG WEBHOOK_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET

RUN pnpm run build

FROM base AS development

EXPOSE 3412

CMD ["pnpm", "run", "dev"]

FROM platformatic/node-caged:25.6.1-slim AS production

WORKDIR /app

COPY --from=build /app/.output /app
COPY --from=build /app/server/database/migrations /app/migrations

EXPOSE 3412

ENV NODE_ENV=production
ENV NITRO_PORT=3412
ENV NITRO_HOST=0.0.0.0

CMD ["node", "/app/server/index.mjs"]
