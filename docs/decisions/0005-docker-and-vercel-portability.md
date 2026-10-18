# ADR 0005: Docker portability with Vercel-first deployment

- Status: Accepted
- Date: 2026-07-12

## Context

Vercel is the initial target, while a reproducible container remains valuable for
validation and portability.

## Decision

Use Next.js standalone output and a multi-stage non-root Docker image without
sacrificing Vercel compatibility.

## Alternatives considered

Vercel-only deployment, a custom server, and a development-only container.

## Consequences

The app has two verified deployment paths without maintaining separate codebases.

## Follow-up implications

Keep platform-specific deployment settings outside application business logic.
