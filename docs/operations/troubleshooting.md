# Troubleshooting

## pnpm version differs

Run `corepack enable` and invoke pnpm through Corepack. Confirm the version matches
`packageManager` in `package.json`.

## Environment validation fails

Copy `.env.example` to `.env.local`, then ensure all values use the exact allowed names
and formats. Do not change `NODE_ENV` to bypass validation.

## Playwright browser is missing

Run `pnpm exec playwright install chromium`. In Linux CI use
`pnpm exec playwright install --with-deps chromium`.

When the Playwright CDN is temporarily unavailable on a development machine with Google
Chrome installed, set `PLAYWRIGHT_CHANNEL=chrome` for that one local test run. Do not
set it in CI; CI uses Playwright's pinned Chromium bundle.

## Docker cannot connect

Start Docker Desktop and wait for its Linux engine to become available before running
Docker or Compose commands. The project does not create or remove unrelated Docker
resources.
