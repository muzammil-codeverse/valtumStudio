# syntax=docker/dockerfile:1
FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update \
  && apt-get install --no-install-recommends --yes openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

FROM base AS fetcher

ENV NO_PROXY="registry.npmjs.org"
ENV no_proxy="registry.npmjs.org"

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Resolve the immutable dependency graph before copying application source. The
# cache persists only in BuildKit and is isolated to Siglum builds. Docker's
# local proxy cannot complete pnpm's 554-request policy pass reliably; this
# build-only exception is governed by ADR 0011.
RUN --mount=type=cache,id=siglum-pnpm-store-v2,target=/pnpm/store,sharing=locked \
  corepack pnpm fetch --frozen-lockfile --trust-lockfile --store-dir=/pnpm/store --network-concurrency=1 --fetch-retries=3 --fetch-timeout=600000 \
  && touch /app/.pnpm-fetch-complete

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# The marker creates an explicit BuildKit dependency so this stage cannot run
# before fetcher has populated the shared, locked store cache.
COPY --from=fetcher /app/.pnpm-fetch-complete /tmp/.pnpm-fetch-complete

# This stage must make no registry requests: it installs solely from the verified
# store populated by fetcher.
RUN --mount=type=cache,id=siglum-pnpm-store-v2,target=/pnpm/store,sharing=locked \
  corepack pnpm install --offline --frozen-lockfile --trust-lockfile --store-dir=/pnpm/store

FROM base AS builder

ENV NO_PROXY="binaries.prisma.sh,registry.npmjs.org"
ENV no_proxy="binaries.prisma.sh,registry.npmjs.org"

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Prisma 7 writes the generated client into source-controlled build output before
# Next.js traces the server routes that import it.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/siglum \
  DIRECT_URL=postgresql://build:build@localhost:5432/siglum \
  corepack pnpm db:generate

# Configuration is required by the root metadata during build. Runtime values
# remain required and are supplied by the deployment environment.
RUN APP_ENV=production LOG_LEVEL=info \
  DATABASE_URL=postgresql://build:build@localhost:5432/siglum \
  DIRECT_URL=postgresql://build:build@localhost:5432/siglum \
  BETTER_AUTH_URL=https://siglum.invalid \
  AUTH_TRUSTED_ORIGINS=https://siglum.invalid \
  BETTER_AUTH_SECRET="$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=')" \
  AUTH_IDENTIFIER_HASH_KEY="$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '=')" \
  AUTH_BOOTSTRAP_ENABLED=false \
  AUTH_SESSION_EXPIRES_SECONDS=43200 \
  AUTH_SESSION_UPDATE_AGE_SECONDS=3600 \
  AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS=604800 \
  AUTH_FAILED_LOGIN_WINDOW_SECONDS=900 \
  AUTH_FAILED_LOGIN_MAX_ATTEMPTS=10 \
  AUTH_FAILED_LOGIN_LOCK_SECONDS=900 \
  APP_BASE_URL=https://siglum.invalid \
  corepack pnpm build

FROM builder AS migrator

CMD ["sh", "-c", "corepack pnpm db:migrate && corepack pnpm db:seed"]

FROM node:24.18.0-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
