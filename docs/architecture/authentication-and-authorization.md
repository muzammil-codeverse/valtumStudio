# Authentication and authorization

Phase 3 uses Better Auth `1.6.23` with its Prisma adapter, email/password credentials,
database-backed rate limiting, static roles, and mandatory TOTP two-factor
authentication. No social, OAuth, passkey, or public-registration provider is
configured.

```txt
Browser -> /api/auth/* -> origin + endpoint policy -> Better Auth -> PostgreSQL
     \-> /api/security/* -> session/assurance guard -> authorization matrix -> PostgreSQL
```

The canonical configuration is `src/modules/auth/server/auth.ts`. It is server-only and
uses `src/modules/auth/server/auth-options.ts` as its schema-generation source of truth.
The latter intentionally has no server-only marker because `auth generate` imports it;
it carries no secrets and is not a route or client import.

## Authentication assurance

`getAuthenticationAssurance` is the single state model used by admin layouts and
sensitive routes: `ANONYMOUS`, `PASSWORD_AUTHENTICATED`, `PASSWORD_CHANGE_REQUIRED`,
`TWO_FACTOR_SETUP_REQUIRED`, and `FULLY_AUTHENTICATED`. A session is insufficient for
admin access until a forced password change, TOTP enrollment, TOTP verification, and
recovery-code acknowledgement are complete. Sessions have a 12-hour expiry, one-hour
refresh age, and a seven-day absolute cap enforced against the server-side session row.

## Authorization

Roles are exactly `owner`, `admin`, and `editor`; unknown stored values fail closed.
`src/modules/auth/policies/authorization.ts` is the application authority for every
role/resource/action decision. Better Auth admin plugin access is deliberately narrower
and supports only the operator functions needed for user and session administration.
There is no impersonation or deletion capability.

Owners administer users, security events, system settings, and all content.
Administrators administer content, leads, and their own sessions but cannot read
security-event detail or manage users. Editors can work on drafts and their own sessions
but cannot publish, archive, change settings, manage leads, or access audit/security
data.

## Schema lifecycle

`auth generate` is a review aid only. Prisma schema and reviewed Prisma Migrate SQL are
the sole migration/deployment authority. `pnpm auth:schema:check` generates the Better
Auth model definition into a temporary directory and verifies that every generated field
is represented in `prisma/schema.prisma`; no generated auth schema file is committed.

The `User`, `Session`, `Account`, `Verification`, `TwoFactor`, and `RateLimit` tables
are Better Auth-owned. `AuthThrottle` and `SecurityEvent` are application-owned. The
operator scripts intentionally use Better Auth's pinned password hashing context but
perform their small, documented multi-row changes through Prisma transactions so they
can atomically update local enforcement fields, revoke sessions, and preserve audit
events. This version-coupled wrapper is covered by the schema and integration gates.
