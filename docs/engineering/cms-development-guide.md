# CMS development guide

CMS reads are server-only and use explicit selected DTOs. Every mutation is a Server
Action that independently requires completed authentication, checks the RBAC permission,
validates input, uses transactions for relational writes, creates an `AuditEvent`, and
invalidates the relevant admin path.

Use `revision` as the optimistic-concurrency token. Updates use a revision-constrained
`updateMany`; an affected count other than one is a conflict. Do not add client-side
role checks as authority, raw HTML, arbitrary setting keys, or unbounded list queries.
