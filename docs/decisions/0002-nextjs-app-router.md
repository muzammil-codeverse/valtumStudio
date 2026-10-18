# ADR 0002: Next.js App Router

- Status: Accepted
- Date: 2026-07-12

## Context

The product needs an integrated public web application and future secure application
routes.

## Decision

Use stable Next.js with the App Router, TypeScript, the `src` directory, and React
Server Components by default.

## Alternatives considered

Pages Router, a custom Express server, and separate frontend/backend applications.

## Consequences

Routes, route handlers, layouts, metadata, and server rendering stay in one supported
framework model.

## Follow-up implications

Keep client boundaries narrow and avoid framework-specific business logic outside the
route layer.
