# Authentication operations

Public signup is disabled. The first account is created only after database migration by
an interactive operator command. It requires a deliberate, temporary feature flag:

```powershell
$env:AUTH_BOOTSTRAP_ENABLED = "true"
pnpm auth:bootstrap-owner
```

The command stops if any user exists, generates a high-entropy temporary password,
prints it once to the operator terminal, creates the owner account with forced password
change, and records `OWNER_BOOTSTRAPPED`. Set the flag back to `false` immediately.
Compose has an opt-in `bootstrap-owner` profile; run it with
`docker compose --profile operators run --rm bootstrap-owner` only after the migration
service has completed.

## Recovery and incident commands

All commands prompt for a typed confirmation, use the configured database, revoke
sessions where appropriate, and create security events. They never accept a password on
a command line or log one except for a generated temporary password printed once to the
invoking terminal.

| Command                          | Effect                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm auth:reset-password`       | Generates a temporary password, marks password change required, and revokes all sessions.           |
| `pnpm auth:reset-two-factor`     | Removes TOTP/recovery data, clears acknowledgement, requires password change, and revokes sessions. |
| `pnpm auth:revoke-user-sessions` | Revokes every session for one account.                                                              |

There is no destructive user-delete command. Controlled role changes and bans preserve
audit history and use a transaction-level PostgreSQL advisory lock to prevent demoting
or banning the last active owner. A ban revokes sessions. Operators should record a
ticket or incident reference outside the application before making privileged changes.

## TOTP and recovery codes

The user confirms their password, receives a QR code and manual setup URI, and must
verify a six-digit TOTP code before recovery codes are displayed. Codes exist only in
client memory for that setup view and are not added to analytics, logs, URLs, or audit
metadata. The user must acknowledge storage before admin access is enabled.
Trusted-device requests are rejected; no device-bypass feature is exposed.

## Audit retention and monitoring

`SecurityEvent` records actor/session IDs when available, HMAC identifier hashes,
request ID, IP/user-agent summaries, event type/outcome/severity/reason, and redacted
bounded JSON metadata. Passwords, tokens, cookies, TOTP values, recovery codes, and
authorization headers are never recorded. Retain events according to the production
privacy schedule; before launch define the retention duration, restricted support
access, export process, and alert thresholds for repeated failures, account lockouts,
MFA resets, owner changes, and untrusted-origin denials.
