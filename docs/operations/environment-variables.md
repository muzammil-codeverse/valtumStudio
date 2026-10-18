# Environment variables

Copy `.env.example` to `.env.local`; never commit local environment files.

| Variable                                | Allowed values / format                             | Purpose                                                                        |
| --------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `APP_ENV`                               | `local`, `test`, `preview`, `staging`, `production` | Deployment environment model.                                                  |
| `APP_BASE_URL`                          | Absolute URL                                        | Canonical application base URL.                                                |
| `LOG_LEVEL`                             | `debug`, `info`, `warn`, `error`                    | Minimum server log level.                                                      |
| `DATABASE_URL`                          | PostgreSQL connection URL                           | Runtime URL for the Prisma PostgreSQL driver adapter.                          |
| `DIRECT_URL`                            | PostgreSQL connection URL                           | Migration and seed URL consumed by `prisma.config.ts`.                         |
| `TEST_DATABASE_URL`                     | PostgreSQL connection URL                           | Isolated database used only by `pnpm test:integration`.                        |
| `POSTGRES_DB`                           | PostgreSQL database name                            | Database initialized by the local Compose PostgreSQL service.                  |
| `POSTGRES_USER`                         | PostgreSQL role name                                | Local Compose PostgreSQL owner and application role.                           |
| `POSTGRES_PASSWORD`                     | Secret                                              | Local Compose PostgreSQL password; never commit a real value.                  |
| `DB_PORT`                               | Local TCP port, default `5434`                      | Host-only PostgreSQL port used by local Compose validation.                    |
| `BETTER_AUTH_SECRET`                    | Base64url, at least 32 decoded random bytes         | Better Auth signing and encryption secret; unique per environment.             |
| `BETTER_AUTH_URL`                       | Absolute origin, HTTPS in production                | Must match `APP_BASE_URL` origin.                                              |
| `AUTH_TRUSTED_ORIGINS`                  | Comma-separated absolute origins                    | Exact allowlist; wildcards are rejected and it must include `BETTER_AUTH_URL`. |
| `AUTH_IDENTIFIER_HASH_KEY`              | Base64url, at least 32 decoded random bytes         | Independent HMAC key for login identifiers in throttle/audit data.             |
| `AUTH_BOOTSTRAP_ENABLED`                | `true` or `false`                                   | Temporary explicit gate for the one-time initial owner command.                |
| `AUTH_SESSION_EXPIRES_SECONDS`          | Positive integer                                    | Session expiry; default 43200 (12 hours).                                      |
| `AUTH_SESSION_UPDATE_AGE_SECONDS`       | Positive integer                                    | Session refresh age; default 3600 (one hour).                                  |
| `AUTH_ABSOLUTE_SESSION_MAX_AGE_SECONDS` | Positive integer                                    | Server-enforced maximum session age; default 604800 (seven days).              |
| `AUTH_FAILED_LOGIN_*`                   | Positive integers                                   | Login window, maximum failures, and temporary lock duration.                   |
| `AUTH_IP_ADDRESS_HEADER`                | Header name, optional                               | Only configure behind a trusted proxy.                                         |
| `AUTH_TRUSTED_PROXY_CIDRS`              | Comma-separated CIDRs, optional                     | Required in production when an IP header is configured.                        |

`NODE_ENV` is controlled by Next.js and Node.js; it is not the complete
deployment-environment model. Missing or invalid application values fail clearly at
server startup. Production must provide its actual base URL and must never fall back
silently to localhost.

Generate each secret independently, for example with
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Do not
use a placeholder, copy a value between environments, or place secrets in source, CI
output, tickets, logs, or shell history. HTTPS is required for `BETTER_AUTH_URL` and
trusted origins in production.

`DATABASE_URL` and `DIRECT_URL` are deliberately separate so deployments can use a
pooled application connection and an unpooled migration connection when their platform
requires it. Local development uses the same direct PostgreSQL endpoint for both.
