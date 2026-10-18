# ADR 0009: Testing from Phase 1

- Status: Accepted
- Date: 2026-07-12

## Context

Infrastructure regressions are cheaper to prevent before business features make them
hard to isolate.

## Decision

Use Vitest, Testing Library, coverage reporting, and Playwright Chromium smoke tests
from the first phase.

## Alternatives considered

Manual-only testing, deferred test setup, and only end-to-end testing.

## Consequences

Configuration, primitives, and routes have repeatable verification paths before feature
delivery begins.

## Follow-up implications

Add meaningful feature tests with each module; avoid coverage targets that reward
shallow assertions.
