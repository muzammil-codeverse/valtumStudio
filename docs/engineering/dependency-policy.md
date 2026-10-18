# Dependency policy

Add a dependency only after verifying its purpose, maintenance, compatibility, license,
bundle effect, and whether the platform already solves the problem. Package versions are
exact and installation is lockfile-driven through pinned pnpm. Production dependencies
require a documented purpose in the implementation report and pull request.

Run `pnpm audit --prod` during release-oriented verification. Classify findings by
direct/transitive and production/development impact; do not force upgrades without
checking compatibility. Dependabot opens controlled weekly update PRs; it never
auto-merges changes. The reviewed pnpm build-script allowlist permits `sharp` for
Next.js image optimization and explicitly denies the unused transitive `unrs-resolver`
script; new scripts fail installation until reviewed. Narrow `postcss` and
`@hono/node-server` security overrides are maintained in `pnpm-workspace.yaml` while the
selected Next.js and Prisma releases retain their older transitive pins. The Hono
override pins `@hono/node-server` to `1.19.13`, the patched release for CVE-2026-39406 /
GHSA-92pp-h63x-v22m; remove it only after the parent dependency resolves to an equal or
newer safe release and `pnpm why @hono/node-server` proves the override is redundant.

Docker dependency stages use `--trust-lockfile` only as a build-scoped exception
described in ADR 0011. It is not a project, user, or CI default. Local and CI validation
must retain normal frozen-lockfile supply-chain verification, plus `pnpm audit --prod`.
The exception is valid only while this private repository prevents untrusted
contributors from changing the lockfile without review; outside contributors must have
their lockfile changes verified normally before trusted Docker builds are allowed.
`--no-verify-store-integrity` and `--force` are prohibited.
