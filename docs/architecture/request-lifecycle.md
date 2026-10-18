# Request lifecycle

1. A request reaches Next.js through Vercel or the standalone container.
2. Baseline security headers are attached by `next.config.ts`.
3. The App Router matches the route and renders server components by default.
4. The health route creates a small JSON liveness response without checking
   dependencies. The readiness route separately executes a minimal PostgreSQL query and
   returns `503` when the database is unavailable.
5. Known future application failures will use `ApplicationError` to retain a stable code
   and safe public message; unexpected failures reach framework boundaries without
   exposing details.
6. Server-side infrastructure may emit sanitized structured console logs until a
   production log transport is added.

Routes must validate untrusted input at their future boundaries and must not send
internal causes, secret values, or stack traces to a browser.
