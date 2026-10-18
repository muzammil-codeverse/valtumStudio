# Coding standards

Use strict TypeScript with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
the other compiler controls recorded in `tsconfig.json`. Do not use `any`, `@ts-ignore`,
`@ts-nocheck`, unsafe double casts, or non-null assertions.

Use named exports for reusable code and default exports only for Next.js file
conventions. Components and types use PascalCase; functions and variables use camelCase;
route segments use kebab-case. Public and architectural function boundaries have
explicit types where they improve contracts.

Keep functions focused, prefer pure transformations, and use comments only for
non-obvious constraints or trade-offs. Avoid speculative abstractions and keep data
access out of client components. ESLint and Prettier are authoritative; run `pnpm check`
before review.
