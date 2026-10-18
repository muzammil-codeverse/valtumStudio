# Container view

The application is one deployable Next.js App Router container and a PostgreSQL
database. Routes compose presentation; future modules will contain feature logic;
`config` owns validated configuration; `lib` owns small stable cross-cutting primitives
including the Prisma driver-adapter client.

```txt
Visitor
  -> Next.js app (routes, layouts, route handlers)
       -> future feature modules
            -> config / components / lib -> PostgreSQL
```

The Docker production image uses Next.js standalone output and a non-root runtime user.
Vercel remains the intended first deployment target; Docker is a working portability and
verification path, not a separate application. Compose additionally runs an ephemeral
migration/seed container before starting the application.
