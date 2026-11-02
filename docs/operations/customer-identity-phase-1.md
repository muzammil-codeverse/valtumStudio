# Phase 1: Customer identity and dashboard foundation

## Product scope

There are two product-facing account types: **one studio administrator** and
**customers**. No vendor accounts, vendor registration, or vendor dashboard exists or is
planned.

The existing internal `owner` role is the sole operator identity. Existing `admin` and
`editor` role definitions remain for backward compatibility, but this phase adds no
additional operator account or operator signup route.

The public marketing site retains its motion system. The authentication and private
dashboard layouts contain no decorative animations or pointer-hover effects. Decorative
eyebrow labels are not used in the new authentication pages.

## Phase breakdown

1. **Identity and foundation**: branded sign-in, customer registration with email
   verification, safe role-aware redirect, existing TOTP and recovery-code controls, one
   owner bootstrap path, dashboards with truthful metrics, schema defaults.
2. **Delivery workspace**: project task interactions, decisions and approvals,
   messaging, file sharing, lifecycle audit events, invoice status and communication.
3. **Intelligence and operations**: cohort analytics, outcome funnels, performance,
   accessibility and security hardening, recovery testing, incident monitoring.

## Production activation gates

Do not enable customer access or registration until all checks pass:

1. Confirm a **restorable production database backup** and verify the target database.
2. Inspect `_prisma_migrations`; run reviewed `prisma migrate deploy` from an authorized
   operator environment, including `20261102010000_client_workspaces` and
   `20261103010000_customer_registration_defaults` where applicable.
3. Confirm no unintended operator accounts. Create the initial owner **only if the
   database is empty** through the existing `pnpm auth:bootstrap-owner` command, with
   `AUTH_BOOTSTRAP_ENABLED=true` only for the trusted operator process. Do not commit
   database credentials, print a password into CI logs, or use a password previously
   shared in chat. Set the bootstrap flag back to false.
4. Confirm owner login, forced password replacement, TOTP enrollment, recovery-code
   acknowledgement, sign-out and session revocation using a real browser.
5. Verify the email delivery domain is marked verified. Configure the production
   `RESEND_API_KEY` and a sender on `mail.valtumstudio.com.au`. Check delivery and
   verification with an authorized test account; avoid speculative sign-up tests against
   real customers.
6. Configure `CLIENT_PORTAL_ENABLED=true`. Confirm authenticated client isolation: the
   customer's membership permits only that customer's workspaces, and invoice drafts
   remain excluded.
7. Only after the preceding gates, set `CUSTOMER_SIGNUP_ENABLED=true`. Verify successful
   customer signup, email verification, no instant session, TOTP setup, empty initial
   workspace, and administrator-managed workspace assignment.
8. Run the full CI suite, app build, production integration tests, mobile browser QA,
   and rollback drills. Never use fake financial or delivery data to pad dashboards.

A registered customer has **zero** workspace memberships initially. The owner grants
membership in `/admin/clients/[id]` using the existing client-only membership action.

Owner-provisioned customers receive a temporary password and are forced to replace it.
Self-registering customers select their own password and verify their email.

## Configuration

- `CLIENT_PORTAL_ENABLED`: disabled by default. Controls customer pages and delivery
  administration.
- `CUSTOMER_SIGNUP_ENABLED`: disabled by default. Public registration is blocked unless
  the portal is also enabled and verification mail is configured.
- `RESEND_API_KEY`, `LEAD_EMAIL_FROM`: server-only verified email sender for account
  verification; these secrets must never enter client-side code.
- `AUTH_BOOTSTRAP_ENABLED`: false in production; only temporarily true for an explicit,
  controlled, one-time operator bootstrap process.

## Release status

The code can pass local TypeScript, lint, unit tests, schema validation and an isolated
production build with generated test-only secrets. The existence and state of the
production administrator, production migration status, and authenticated browser
acceptance must be independently verified. Do not treat a Vercel READY build as evidence
that those database and identity gates have passed.
