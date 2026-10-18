# ADR 0001: Modular monolith

- Status: Accepted
- Date: 2026-07-12

## Context

V1 needs one coherent product while future features will have distinct responsibilities.

## Decision

Use one modular Next.js application with explicit feature, route, shared-component,
configuration, and infrastructure boundaries.

## Alternatives considered

Microservices, a separate API repository, and a monorepo with multiple deployables.

## Consequences

Deployment and data consistency remain simple while modules can evolve independently
inside clear boundaries.

## Follow-up implications

Future features expose small public APIs and must preserve the documented dependency
direction.
