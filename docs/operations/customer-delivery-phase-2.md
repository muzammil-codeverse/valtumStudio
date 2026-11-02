# Valtum Studio · Phase 2 customer delivery workspace

## Scope and roles

There are only **two product-facing roles**: the studio administrator and customers. No
vendor features, vendor registration or vendor dashboards are introduced. Internal
legacy roles remain available for historical data compatibility, without new operator
signup paths.

The public marketing site is unchanged by this release. Authenticated dashboards remain
static, including hover states and motion. No decorative eyebrow labels have been added.

## Delivered code

- Customer and studio workrooms per project with threaded chronological project
  messages, optional task context, named authors, timestamps and message throttling
- Studio-created approval requests bound to project and, optionally, a specific
  milestone's **content revision**
- Customer approval or changes-requested response, optional/required feedback,
  single-use revision-checked state transition, and studio withdrawal controls
- Stale approval responses rejected when the milestone brief has changed; changed
  milestone content cannot be marked approved using an old customer signoff
- Studio project-plan editing, dates, task/milestone details and guarded status updates,
  with optimistic revision checks
- Invoice draft-to-issued workflow extended with manually recorded `ISSUED → PAID` and
  `ISSUED → VOID` transitions requiring an operator reference/reason; no processor or
  automatic payment integration is implied
- Per-project activity history with **admin-only audit visibility** for draft invoice
  events and customer-visible activity for published changes
- Private file reservation, signed PUT upload, server-side metadata/signature/hash
  verification, private download forced as attachment and membership checks
- Customer and studio calendar includes dated approval requests from actual records
- Integration and unit tests for cross-tenant project access, single-use approvals,
  draft-invoice privacy, and verified-file visibility

## Database

The migration `20261103020000_delivery_collaboration` adds:

- `client_decisions`, `client_messages`, `client_files`, `client_delivery_events`
- `client_milestones.content_revision` and optimistic revision counters
- `client_tasks.revision`
- `client_invoices.payment_reference`

All new tables are linked to genuine engagements. The migration is additive and retains
all existing project, customer, invoice and marketing records.

## Security and privacy model

Customer access is checked at the application server using the completed authentication
state and current membership. IDs alone confer no access. The customer has no update
privilege over studio task status, milestone status or invoice payment state.

Every explicit approval response is transactionally recorded with the account that
responded, its timestamp and approval revision. A second simultaneous response cannot
overwrite the first. Internal invoice-draft events are excluded from customer activity
queries. User-supplied messages are rendered as text rather than interpreted as HTML.

Private file upload rules are based on
https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html : only
PDF/JPG/PNG by allowlist and signature, max 10 MB, cryptographic SHA-256 verification,
randomized storage keys, private bucket, 5-minute signed PUT, authorized read, download
as attachment with no sniffing and no caching.

**Important:** File signature verification is not a malware scanner. Before production
activation, the private bucket must be tested for ACL, CORS, head/range operations,
lifecycle cleanup, malware scanning/CDR, storage limits, and signed-upload
compatibility.

## Production activation gate

Do **not** apply production schema changes or enable portal/file services without an
approved restorable backup and migration-status verification.

1. Confirm database backup/restore, applied Phase 1 migrations, and new Phase 2
   migration consistency. Apply the migration through controlled `prisma migrate deploy`
   only after a rollback plan is documented.
2. Establish the single intended administrator account and verify forced password
   replacement plus TOTP and recovery-code storage.
3. Enable `CLIENT_PORTAL_ENABLED` only after authenticated cross-tenant acceptance with
   two real, authorized test customer accounts.
4. Verify that a customer cannot see another customer's decisions, messages, project
   files, draft invoices, or internal audit events.
5. Test task briefs, explicit approvals and revisions, message posting, milestone
   calendar dates, manually confirmed invoice status and audit records using
   authenticated browser sessions on desktop and mobile.
6. Keep `DELIVERY_FILES_ENABLED=false` until the private S3-compatible storage
   credentials, bucket CORS, malware controls and upload/download acceptance pass. File
   exchange also requires `MEDIA_STORAGE_ENABLED=true`.
7. Keep `CUSTOMER_SIGNUP_ENABLED=false` until the Phase 1 registration and verification
   acceptance passes; do not create synthetic customer workspaces.

## Deliberate limitations

This is an in-app delivery workspace, **not** a legally binding e-signature provider,
payment processor, bank reconciliation system, guaranteed email/SMS notification service
or live chat with presence. Invoice payment confirmation must be based on independently
verified settlement. No bank payment or signed contract should be invented.

The activity feed retains the most recent 40 events, and the workroom lists the latest
80 messages, 60 decisions and 60 verified files per project. The historical data remains
in the database; deep pagination and retention automation are part of Phase 3. Signed
upload reservations that expire before finalization must be swept by an authorized
storage lifecycle job before file activation.

## Acceptance

Code quality and integration CI are necessary, not sufficient, for production
acceptance. Do not mark tenant isolation, storage interoperability, production
migration, real administrator login or customer onboarding as verified unless an actual
authenticated production acceptance run has established those outcomes.
