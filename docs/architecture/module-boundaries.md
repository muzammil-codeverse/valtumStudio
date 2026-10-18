# Module boundaries

## Dependency direction

```txt
app
  -> modules
    -> components / lib / config
```

`src/app` owns framework routes, layouts, and route handlers. It must not become a home
for reusable domain logic. Future feature modules expose intentional root `index.ts`
APIs and do not import route files. Shared infrastructure does not import features, and
`components/ui` does not import business modules.

ESLint rejects direct violations of these rules for module, shared infrastructure, and
UI primitive files. Cross-module deep imports are reviewed manually until a first
feature establishes an enforceable public-API convention.

## Server and client boundary

React Server Components are the default. A file gets `"use client"` only when it
requires browser state, events, effects, or browser APIs. Server-only modules are marked
with `server-only`; client code must never import them or receive secrets. Environment
values without `NEXT_PUBLIC_` remain server-only.

## Circular dependencies

No circular application dependencies are known in Phase 1. New modules must avoid cycles
through narrow public APIs and code review; a dedicated cycle tool will be considered
only when the codebase has enough modules to justify it.
