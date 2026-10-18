# Phase 6: Lead capture and CRM foundation

Phase 6 adds a private, server-enforced CRM foundation for prospective-client enquiries.
It deliberately does not include public contact-page design, email delivery, file
uploads, or external CRM integration.

## Submission flow

`POST /api/leads` accepts a bounded JSON payload only. It requires explicit consent, a
privacy-copy version, a client submission token, and an empty honeypot field. Validation
is centralized in `src/modules/leads/domain/submission.ts`; names and attribution fields
are trimmed, email is lower-cased, empty optional values become database nulls, and only
`http`/`https` URLs are accepted. Project prose is only trimmed, not semantically
rewritten.

The public response never exposes a lead ID, status, duplicate outcome, assignee,
database detail, or spam information. Malformed input returns a generic rejection;
accepted submissions and suppressed duplicates return the same accepted response.

## Abuse, replay, and privacy

`LEAD_IDENTIFIER_HASH_KEY` is required for public lead persistence and must be a
high-entropy secret. It is used with distinct HMAC domains for requester rate-limit
keys, email rate-limit keys, and duplicate fingerprints. Raw IP addresses and raw
fingerprint inputs are not persisted.

The initial policy is 12 requester attempts per 15 minutes and 8 email attempts per
hour. Database-backed bucket rows are atomic upserts and retain an expiry timestamp;
operations should periodically remove expired bucket and duplicate-window rows. A
submission token is unique. Separately, a compound-unique fingerprint/window record
prevents equivalent submissions during the 15-minute duplicate window without making
email permanently unique.

## CRM workflow

The private routes are `/admin/leads` and `/admin/leads/[id]`. Owners and admins can
read, change status and priority, assign eligible active owners/admins, append notes,
archive, restore, and review activity. Editors have no lead permission. Checks occur in
route loaders and every Server Action.

Statuses are `NEW`, `IN_REVIEW`, `QUALIFIED`, `CONTACTED`, `DISCOVERY`, `PROPOSAL`,
`WON`, `LOST`, and `SPAM`. `CLOSED` remains in the database enum only for historical
records; it is rendered safely but is never offered as a new workflow transition. Use
`WON` and `LOST` for new terminal outcomes. Priorities are `LOW`, `NORMAL`, `HIGH`, and
`URGENT`. First-entry milestone timestamps are preserved. Notes are plain-text,
append-only, and limited to 4,000 characters.

Each mutation requires the current revision. The update predicate includes both ID and
revision, increments the revision atomically, and creates a lead activity plus existing
system audit event in the same transaction. Stale submissions return a safe conflict
message. Archival is soft and preserves all relations and audit history.

## Schema and migration

The migration is `20260714120000_phase6_lead_crm_foundation`. It adds structured
project-fit fields, attribution, revisioning, activities, notes, normalized service
interests, rate-limit buckets, and duplicate-window records. The old permanent email
unique index is removed so future enquiries remain possible; no table or column is
dropped. Existing leads receive safe legacy defaults for newly required project fields,
then non-empty historical `message` values are backfilled into `project_summary` without
replacing non-empty summaries. The lead list has a `priority, created_at` index.

The migration was produced from the connected development schema using
`prisma migrate diff` after the interactive `migrate dev --create-only` path was
unavailable in this non-interactive environment. It was reviewed for prohibited
destructive table/column SQL and was not applied.

Before deployment, set `LEAD_IDENTIFIER_HASH_KEY`, review the migration in the target
PostgreSQL version (enum-value additions require PostgreSQL 12+ in a single migration),
then run the approved deployment migration command. Phase 12 can attach email delivery
to a `LeadNotificationPort`-style adapter after persistence; Phase 7 media attachments,
Phase 14 exhaustive QA, and Phase 15 deployment work remain deferred.

## Verification

Run the following after setting environment variables and reviewing the migration:

```powershell
corepack pnpm db:generate
corepack pnpm exec vitest run src/modules/leads
corepack pnpm lint
corepack pnpm typecheck
```

## Dedicated integration database

Prepare and execute the dedicated integration database with:

```powershell
corepack pnpm test:integration
```

This command requires `TEST_DATABASE_URL` and a distinct `DATABASE_URL`. It refuses to
run if their normalized database identities match, only permits the approved
`siglum_test` database name, resets that dedicated database, deploys the migration
history, seeds it, and runs only `*.integration.test.ts` and `*.integration.test.tsx`
files with the Node Vitest configuration. It never falls back to `DATABASE_URL` for the
test database.
