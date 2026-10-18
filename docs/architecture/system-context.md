# System context

## Implemented in Phase 2

Public visitors interact with the Next.js application over HTTPS in a future deployment.
The application serves a temporary public route, a liveness route, and a database
readiness route. PostgreSQL stores structured service offerings, projects, tags, and
leads. It is portable to Vercel and a standalone Docker container.

## Planned, not implemented

| Actor or system             | Intended interaction                                    |
| --------------------------- | ------------------------------------------------------- |
| Public visitor              | Views public marketing content and later submits leads. |
| Siglum administrator/editor | Uses a future protected administration interface.       |
| PostgreSQL                  | Stores structured content, leads, and operational data. |
| Email provider              | Sends future lead and operational messages.             |
| Analytics provider          | Receives future consent-aware measurements.             |
| Error-monitoring provider   | Receives future sanitized production telemetry.         |
| Deployment platform         | Builds and serves the Next.js application.              |
| DNS/security platform       | Provides DNS, TLS, and edge security controls.          |

The database is represented by an explicit Prisma schema, reviewed migration history,
and a PostgreSQL driver adapter. Other planned integrations remain absent from the
runtime dependency graph.
