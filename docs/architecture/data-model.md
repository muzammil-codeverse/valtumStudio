# Data model

Phase 3 uses PostgreSQL as the durable source for structured content, leads, identity,
sessions, throttling, and security audit data. The schema lives in
`prisma/schema.prisma`; Prisma migrations are the only supported mechanism for changing
production database structure.

| Model                                  | Responsibility                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ServiceOffering`                      | Ordered, publishable representation of a Siglum service.                                           |
| `Project`                              | Publishable case-study content with optional challenge, solution, and outcome.                     |
| `Tag`                                  | Reusable project categorisation.                                                                   |
| `ProjectService`                       | Explicit many-to-many relationship from a project to service offerings.                            |
| `ProjectTag`                           | Explicit many-to-many relationship from a project to tags.                                         |
| `Lead`                                 | A consent-aware incoming enquiry with a constrained workflow status.                               |
| `User`                                 | Better Auth identity plus static role, ban state, onboarding, and recovery acknowledgement fields. |
| `Session` / `Account` / `Verification` | Better Auth opaque sessions, credential accounts, and one-time verification data.                  |
| `TwoFactor` / `RateLimit`              | Better Auth TOTP/recovery material and framework rate-limit state.                                 |
| `AuthThrottle`                         | Application-owned HMAC-keyed login failure counter and temporary-lock state.                       |
| `SecurityEvent`                        | Append-only security/audit event with indexed actor, type, severity, and time fields.              |

`PublicationStatus` prevents unpublished content from being accidentally treated as
public. `LeadStatus` provides a minimal workflow (`NEW`, `CONTACTED`, `QUALIFIED`,
`CLOSED`) without encoding user-interface decisions in the database.

Every mutable content model has `createdAt` and `updatedAt` timestamps. Public slugs and
lead email are unique. Explicit junction tables make relationship constraints, cascade
behaviour, and future metadata additions visible in the domain model.

The runtime client uses Prisma's PostgreSQL driver adapter and `DATABASE_URL`; migration
and seed commands use `DIRECT_URL` through `prisma.config.ts`. This separation supports
pooled runtime database URLs without compromising direct migration connectivity.

Security-event user/session references use `SET NULL` on deletion to preserve the event;
Better Auth account/session/TOTP references cascade with their owning user. Prisma
Migrate is the only schema deployment mechanism, including Better Auth generated tables.
