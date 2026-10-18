# Git workflow

`main` is the protected integration branch. Work uses short-lived `feature/*` or `fix/*`
branches and reaches `main` by pull request after required CI passes. Use squash merge
to retain a clean history unless a documented repository policy changes this decision.
Do not create a permanent `develop` branch by default.

Use meaningful conventional-style subjects, such as
`chore: initialize Next.js engineering foundation`,
`ci: add immutable quality workflow`, `test: add foundation smoke coverage`, and
`docs: record modular monolith decision`.

Do not commit secrets. Review the pull-request template before requesting approval.
