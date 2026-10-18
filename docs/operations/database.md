# Database operations

## Local database lifecycle

Copy `.env.example` to `.env.local`, choose a non-production local password, then run:

```powershell
docker compose --env-file .env.local up -d db
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm test:integration
```

Compose maps PostgreSQL to `127.0.0.1:5434` by default and initializes an isolated
`siglum_test` database only when its named volume is first created. Use `DB_PORT` if
5434 is occupied.

## Schema changes

1. Change `prisma/schema.prisma` deliberately.
2. Create a migration against a disposable local database with
   `pnpm prisma migrate dev --name <change-name> --create-only`.
3. Review the generated `migration.sql` before committing it.
4. Apply it with `pnpm db:migrate`, seed with `pnpm db:seed`, and run
   `pnpm test:integration`.

Never use `prisma db push` as a deployment mechanism. Production applies reviewed,
committed migrations with `prisma migrate deploy` and uses a direct, credentialed
`DIRECT_URL` stored in the deployment environment.

## Readiness and recovery

`/api/health` is a process liveness probe. `/api/ready` confirms that the application
can query PostgreSQL and returns `503` if it cannot. Preserve the named Compose database
volume during ordinary `docker compose down` operations. Resetting a local database is a
deliberate destructive action and requires removing the `siglum-postgres-data` volume.
