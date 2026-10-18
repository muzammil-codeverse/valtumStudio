# Structured CMS

Phase 5 extends the Phase 2 data model without replacing its client, authentication, or
authorization boundaries. `PublicationStatus` is shared by service offerings, projects,
insights, FAQ groups, and team members. All top-level editorial records use revisions,
actor references with `SET NULL`, and audit events.

Editorial content is structured: rich text is serialized JSON with derived plain text.
It is never rendered as author-supplied HTML. Published slug changes must create a
`RedirectRule` in the same transaction when an editor surface exposes slug changes.

The existing project uses CUID primary keys, not UUIDs; this migration preserves that
established identifier convention to avoid an unsafe cross-model identifier migration.
