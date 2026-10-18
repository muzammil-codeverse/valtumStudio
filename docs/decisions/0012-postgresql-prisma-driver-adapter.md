# ADR 0012: PostgreSQL with Prisma driver adapter

## Status

Accepted

## Context

Siglum requires durable structured content, project relationships, and lead workflow
data. The application must support direct local PostgreSQL, production connection pools,
reviewable migration history, and repeatable integration tests.

## Decision

Use PostgreSQL 18.4 and Prisma 7 with generated client output outside the schema folder.
The runtime creates Prisma Client with `@prisma/adapter-pg` and `DATABASE_URL`.
`prisma.config.ts` reads `DIRECT_URL` for migrations and seeding. Schema changes are
committed as reviewed Prisma migrations; deterministic seed data is exercised by an
isolated test database.

Compose starts PostgreSQL, runs migration and seed work to completion, then starts the
web service. The liveness route remains dependency-free and a separate readiness route
checks PostgreSQL.

## Consequences

The repository has a clear relational source of truth and a production-safe path for
pooled application URLs. Generated Prisma Client output is reproducible and ignored by
Git, so every build and CI job runs `pnpm db:generate`. Database-dependent tests require
an available PostgreSQL instance and remain separate from fast unit tests.
