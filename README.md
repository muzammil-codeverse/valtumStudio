# Valtum Studio

## Current phase

This repository contains Phase 3 of Siglum Studio V1: the engineering/database
foundation plus authentication and authorization. It provides a minimal public
placeholder, liveness and readiness endpoints, reviewed PostgreSQL migrations, Better
Auth email/password sessions, static `owner`/`admin`/`editor` roles, mandatory TOTP
onboarding, recovery-code acknowledgement, session management, security events, and
explicit operator recovery workflows. Public content management and final public
presentation remain future phases.

## Prerequisites

- Node.js `24.18.0` (see `.node-version` or `.nvmrc`)
- pnpm `11.28.8`, activated through Corepack
- Docker Desktop for PostgreSQL and container validation

## Local setup

```bash
corepack enable
corepack pnpm --version
Copy-Item .env.example .env.local # PowerShell
pnpm install --frozen-lockfile
# Generate two independent base64url secrets, then put them in .env.local.
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
pnpm dev
```

Open `http://localhost:3000` and `http://localhost:3000/api/health`. After starting the
database, `http://localhost:3000/api/ready` confirms PostgreSQL connectivity.

## Common commands

| Command                                                  | Purpose                                                  |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                                               | Run the local development server.                        |
| `pnpm check`                                             | Run formatting, linting, type checks, and unit tests.    |
| `pnpm test:coverage`                                     | Run unit tests with coverage reports.                    |
| `pnpm test:e2e`                                          | Run the Chromium foundation smoke tests.                 |
| `pnpm db:generate`                                       | Generate the Prisma PostgreSQL client.                   |
| `pnpm db:migrate`                                        | Apply reviewed Prisma migrations.                        |
| `pnpm db:seed`                                           | Upsert deterministic local foundation data.              |
| `pnpm test:integration`                                  | Validate migrations and seeded data in `siglum_test`.    |
| `pnpm auth:schema:check`                                 | Detect Better Auth/Prisma schema drift.                  |
| `pnpm auth:bootstrap-owner`                              | Interactively create the one allowed initial owner.      |
| `pnpm auth:reset-password`                               | Operator password recovery with session revocation.      |
| `pnpm auth:reset-two-factor`                             | Operator MFA recovery with session revocation.           |
| `pnpm build`                                             | Create the production Next.js build.                     |
| `pnpm ci:verify`                                         | Run the complete local Phase 1 verification path.        |
| `docker compose --env-file .env.local up --build --wait` | Run the full local PostgreSQL, migration, and web stack. |

## Repository structure

```txt
src/app/        Next.js routes, layouts, and route handlers
src/modules/    Future feature modules (documented, not implemented)
src/components/ Shared and generic visual components
src/config/     Validated configuration and static application identity
src/lib/        Small stable infrastructure primitives
src/test/       Shared test setup and utilities
docs/           Architecture, operations, engineering, and scope records
```

## Development workflow

Create short-lived `feature/*` or `fix/*` branches, keep scope focused, and open a pull
request to `main`. Required CI must pass before merge. See the
[Git workflow](docs/engineering/git-workflow.md) and
[definition of done](docs/engineering/definition-of-done.md).

## Documentation

- [Architecture](docs/architecture/README.md)
- [Local development](docs/operations/local-development.md)
- [Docker](docs/operations/docker.md)
- [Environment variables](docs/operations/environment-variables.md)
- [Testing strategy](docs/engineering/testing-strategy.md)
- [Data model](docs/architecture/data-model.md)
- [Database operations](docs/operations/database.md)
- [Authentication architecture](docs/architecture/authentication-and-authorization.md)
- [Authentication operations](docs/operations/authentication.md)
- [Authentication threat model](docs/security/threat-model.md)

## Troubleshooting and security

See [troubleshooting](docs/operations/troubleshooting.md) for setup failures. Never
commit `.env.local` or production credentials. Follow [SECURITY.md](SECURITY.md) for
vulnerability reporting.
