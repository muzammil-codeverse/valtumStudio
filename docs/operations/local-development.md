# Local development

1. Install Node.js `24.18.0`; `.node-version` and `.nvmrc` are authoritative.
2. Enable Corepack and confirm pnpm `11.12.0`.
3. Copy `.env.example` to `.env.local` and review the non-secret values.
4. Run `pnpm install --frozen-lockfile`.
5. Run `docker compose --env-file .env.local up -d db` to start PostgreSQL on port 5434.
6. Run `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:seed`.
7. Run `pnpm dev` and open `http://localhost:3000`.

Run `pnpm check` for quick quality gates or `pnpm ci:verify` for the full local
verification path. The initial page is intentionally not a public launch page.

Run `pnpm test:integration` after the database is available. It prepares only
`TEST_DATABASE_URL`, which Compose creates as `siglum_test` during first initialization.
