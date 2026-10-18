# ADR 0011: Scoped trusted lockfile for Docker dependency fetches

- Status: Accepted
- Date: 2026-07-13

## Context

pnpm 11.12.0 verifies the frozen lockfile against supply-chain policies for 554 entries.
Normal host installation on Node 24.18.0 and `pnpm audit --prod` pass. In Docker
Desktop, the configured local proxy can resolve the registry and serve small requests,
but sustained pnpm registry traffic produces connection resets and request timeouts. The
normal Docker attempt completed the 554-entry policy check but did not finish its
tarball fetch.

## Decision

Only the Dockerfile's `pnpm fetch` and its offline `pnpm install` use
`--trust-lockfile`, always with `--frozen-lockfile`. The fetch/store cache is named
`siglum-pnpm-store-v2` and locked to mutually trusted Siglum builds. The `v2` identity
isolates the final validation from the original cache and holds only successfully
fetched Siglum dependency artifacts.

This exception applies only while the repository is private and every lockfile change is
reviewed before it reaches the Docker build. Host and CI installs must continue to run
normal supply-chain verification; production audit remains mandatory. External or
otherwise untrusted contributors must not be permitted to trigger a trusted Docker build
from a changed lockfile.

## Consequences

`--trust-lockfile` skips pnpm's supply-chain policy re-check, including its
minimum-release-age evaluation, in the Docker dependency stages. It does not unfreeze
dependency resolution, alter the reviewed lockfile, disable package store integrity
verification, or suppress the normal host/CI verification and production audit. The
residual risk is that a malicious reviewed-in lockfile could avoid the Docker-only
policy re-check; code review and the normal gate are therefore required safeguards.

## Removal criteria

Remove this exception when Docker builds can complete a normal
`pnpm fetch --frozen-lockfile` through the configured network path for three consecutive
clean builds (including CI or an equivalent isolated runner), while normal lockfile and
production-audit gates remain green. Record the validation in the pull request that
removes both `--trust-lockfile` uses and this ADR exception.
