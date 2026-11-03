# Phase 3: Reliable customer delivery operations

This extends Phase 2 with complete history, trustworthy metrics, in-app notices and
guarded private file lifecycles. There are only two product-facing groups: studio
administrators and customers. No vendor features or vendor accounts are introduced.

## History and inbox

Customer project history and administrator project history are separate routes, both
scoped to actual workspace membership or operator authorization. They support 24 records
per page, deterministic created-time-plus-ID ordering, a validated cursor, scoped search
and status filters. Messages, decisions, files and activity can be browsed beyond the
previous fixed 80/60/40 record windows. Internal activity remains hidden from customers.

The personal inbox is derived from saved delivery events, not fabricated notices. It has
a membership-scoped unread count, read timestamp/ID watermark, monotonic mark-all-read,
and a paginated history. No guaranteed email/SMS/push notifications or live presence are
claimed.

## Complete and honest analytics

Customer task and milestone completion metrics derive from the complete scoped database
aggregates, not the first 100 list rows. Per-project task and milestone counts are
computed separately. Invoice totals are grouped by currency and status, with monthly
groups from parameterized tenant-scoped SQL. Customer invoice history has paginated
access and excludes internal drafts. Calendar events are queried for the requested month
and adjacent week without the overview's record limit.

## File safety controls

File exchange is NOT enabled automatically. All uploads remain private and gated.

A short-lived signed PUT targets a random temporary key. One transactional VERIFYING
claim prevents simultaneous finalizers. The server copies the temporary object into a
different key that cannot be overwritten using the signed PUT URL. The copy is checked
for size, SHA-256, content signature, and a clean ClamAV INSTREAM result before
atomically becoming READY. Downloads require a scan completion marker. Scanner outages
and infected files fail closed.

PDF support is blocked at the upload API regardless of environment flags. A future
implementation must actually transform PDFs through a sandboxed content disarm and
reconstruction workflow and scan the transformed output; a boolean environment flag does
not constitute a working CDR integration. Accepted image files and the private bucket
still need live test coverage for CORS, ACL, antivirus definitions, storage timeouts,
private network restrictions and authenticated cross-tenant access.

A daily protected Vercel Cron route can remove abandoned uploads and stale
verified-source copies. It is gated behind a long bearer secret and a disabled
maintenance flag until the private bucket is validated. It processes batches of 25,
preserves database audit tombstones and returns counters only.

## Migration and release

The additive Phase 3 migration adds user activity read state, history indexes, file scan
and storage cleanup state, and the VERIFYING enum value. Previous production data and
the animated marketing website are unaffected by the code.

Required production activation sequence:

1. Confirm the production DB backup, rehearse restoration, inspect migration history,
   and document rollback before applying Phase 3 schema.
2. Securely create the single authorized administrator when the user approves, with
   forced password change, MFA, and recovery-code protection.
3. Check two distinct, authorized customer workspaces, including tenancy for project
   history, calendar, invoices, file downloads and notifications.
4. Only then enable the customer portal. Leave public customer signup disabled until
   verified onboarding is accepted.
5. Validate live S3-compatible bucket, CORS, private ACL, ClamAV daemon on a private
   network, actual antivirus definitions, PDF CDR if relevant, safe retention and
   maintenance. Keep file exchange and cleanup disabled meanwhile.
6. Complete authenticated responsive, keyboard, screen-reader and security acceptance
   tests for both roles before declaring the portal launched.

No vendor, payment processor, bank settlement verifier, legal e-signature, automated
guaranteed outbound notifications or fabricated performance figures are included. CI and
Vercel READY verify source/build readiness, not production database or account
activation.

References: OWASP File Upload and Authorization Cheat Sheets; Prisma cursor pagination
documentation; Vercel Cron Jobs usage and security documentation.

## Follow-up security audit

The scanner host configuration rejects public IP addresses and arbitrary public DNS
names. Only local, RFC1918/private, Railway internal, or Kubernetes service endpoints
may be configured. This is defense in depth, not proof of network isolation: production
firewall/private-service policies and ClamAV signature updates still need verification.
