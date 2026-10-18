# Docker

The Dockerfile builds a standalone Next.js production image on
`node:24.18.0-bookworm-slim` and runs as the non-root `nextjs` user.

Run `docker build -t siglum-studio-web:phase-3 .`, then run
`docker run --rm -d --name siglum-studio-phase-3 -p 127.0.0.1:3000:3000 --env-file .env.local siglum-studio-web:phase-3`.

Verify `http://localhost:3000/` and `http://localhost:3000/api/health`, then stop the
container with `docker stop siglum-studio-phase-2`.

For the complete local stack, run `docker compose --env-file .env.local config`,
`docker compose --env-file .env.local up --build --wait`, and
`docker compose --env-file .env.local down`. Compose runs PostgreSQL 18.4, a one-shot
migration/seed service, then the web service. It binds the web service to
`127.0.0.1:${WEB_PORT:-3000}` and PostgreSQL to `127.0.0.1:${DB_PORT:-5434}`. Set
`WEB_PORT=3001` when another local service already owns port 3000.

Verify `http://localhost:${WEB_PORT:-3000}/api/ready` after Compose reports success. The
readiness route confirms PostgreSQL connectivity; `/api/health` remains a liveness route
and intentionally does not depend on PostgreSQL. `docker compose down` preserves the
named `siglum-postgres-data` volume. Remove that volume only when intentionally
resetting local database data.

Compose is a production-container validation path, not the default hot-reload workflow.
Use `pnpm dev` for routine frontend development.

Compose does not bootstrap an owner automatically. After migrations complete, set
`AUTH_BOOTSTRAP_ENABLED=true` only for the interactive, one-time
`docker compose --profile operators run --rm bootstrap-owner` command, then set it back
to `false`. The web service refuses to start without the required Better Auth values.
