# Security boundaries

- `.env.local` is local-only and validated by the server environment schema.
- Application code accesses server configuration through `src/config/env`, not scattered
  `process.env` reads.
- The server logger redacts common secret-bearing keys and values and does not emit
  error stacks by default.
- Baseline HTTP headers include a conservative CSP, frame-ancestor protection,
  `nosniff`, referrer policy, and restrictive permissions policy.
- The container runs as a non-root `nextjs` user.
- CI has read-only contents permission, immutable action references, frozen package
  installation, and no deployment secrets.
- Authentication configuration is fail-fast: strong independent secrets, exact trusted
  origins, and production HTTPS are required. Proxy-derived IP headers require explicit
  trusted proxy CIDRs in production.
- Authorization is server-side and matrix-based; client routing is never a permission
  boundary. Security-event metadata is redacted and bounded before storage.
- Passwords, session tokens, TOTP secrets, recovery codes, and raw login identifiers are
  excluded from application audit events and diagnostic logs.

The CSP permits inline scripts and styles required by the current Next.js runtime. A
nonce-based policy is deferred until the rendering and third-party integration model is
known; it must be tightened before adding external scripts.
