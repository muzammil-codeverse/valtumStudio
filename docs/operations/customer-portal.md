# Valtum Studio — customer portal rollout

## Product scope
The portal is a deliberately isolated customer experience behind /portal with read-only delivery progress, milestones, tasks, issued invoices, published updates, and due-date calendars. The admin-side /admin/clients manages workspaces, client membership, project stages, tasks, milestones, invoice drafts/issuance, and updates. It does not expose unrelated internal CRM, CMS, security or operational data.

All dashboards have zero animations and zero transitions, including mobile navigation and charts. Only actual database values are displayed. This rollout does not modify the public marketing website.

## Security and authorization
- Client accounts use a dedicated Better Auth role (`client`) with **no** admin resource permissions.
- Password change and two-factor setup still apply to all accounts.
- The public registration endpoint remains disabled.
- The owner provisions a client account and shares its initial password through an approved private channel; the client must change it on first login.
- Every project lookup contains the verified logged-in member ID inside the database query. Do not rely on an untrusted customer workspace ID or path-only authorization.
- Draft invoices and unpublished updates are never exposed to customers; only issued/paid invoices and published progress updates appear.
- Confirm the stored `mustChangePassword` flag for clients created via Better Auth admin operations before live onboarding.

## Deployment gate
1. Take and verify a restorable PostgreSQL backup, and confirm environment target.
2. Review new additive Prisma migration `20261102010000_client_workspaces` against production.
3. Apply `corepack pnpm db:migrate:deploy` to the **correct** Railway production DB, without `migrate reset`.
4. Set Vercel production `CLIENT_PORTAL_ENABLED=true` only after migration verifies.
5. Redeploy/publish the tested main SHA.
6. As owner, create a real client workspace; provision a client account with a temporary 14+ character password; verify two-factor onboarding and separate permissions.
7. Add one real engagement, milestones, tasks, and a drafted invoice; ensure drafts are invisible to clients until issued.
8. Verify tenant isolation: two different client accounts must not view or infer each other's engagement IDs, progress notes, or invoices.
9. Verify accessibility and mobile layouts; use browser acceptance tests with authorized test users in an isolated staging database before production data operations.

## Deliberately not claimed complete
- Online card payment processing, downloadable invoices, contracts/e-signatures, private file delivery, customer messaging, invitations, email notification retries, billing settlement reconciliation and two-way calendar booking are not included in this rollout.
- These require separate authorization, compliance, retention, security and billing acceptance criteria. No fake production clients or billing data should be inserted.
