# ADR 0003: One system with two public presentations

- Status: Accepted
- Date: 2026-07-12

## Context

Desktop and mobile public experiences will have different compositions without divergent
business rules.

## Decision

Keep one application, backend, content source, URL system, and SEO model while later
phases create purpose-built desktop and mobile presentation compositions.

## Alternatives considered

Duplicated desktop/mobile sites, separate repositories, and duplicated routes.

## Consequences

Content, validation, and data access can remain shared while presentation ordering
adapts to the device.

## Follow-up implications

Do not create final desktop navigation or mobile bottom navigation in Phase 1.
