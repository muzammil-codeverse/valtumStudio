# ADR 0004: Pinned Node.js and pnpm

- Status: Accepted
- Date: 2026-07-12

## Context

Repeatable local, CI, and container builds require consistent runtime tooling.

## Decision

Pin Node.js 24.18.0 and pnpm 11.12.0 in project metadata, documentation, CI, and Docker.

## Alternatives considered

Unpinned system installations, npm, Yarn, Bun, and Node.js Current.

## Consequences

The lockfile and Corepack give deterministic package installation with a known LTS
runtime.

## Follow-up implications

Update pins deliberately after compatibility, security, and release-note review.
