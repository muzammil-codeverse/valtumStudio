# ADR 0007: Server Components by default

- Status: Accepted
- Date: 2026-07-12

## Context

The initial public surface should minimize client JavaScript and avoid accidental secret
exposure.

## Decision

Use React Server Components by default and add `"use client"` only at narrow, necessary
interaction boundaries.

## Alternatives considered

Client-rendering all routes and marking layouts as client components for convenience.

## Consequences

Server-only configuration and future data access can remain outside browser bundles.

## Follow-up implications

Review every client boundary for browser need, imported dependencies, and serializable
props.
