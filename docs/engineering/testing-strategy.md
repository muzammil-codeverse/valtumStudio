# Testing strategy

Vitest provides unit and small component tests with jsdom and Testing Library. Phase 1
tests configuration parsing, an error primitive, health response construction, and the
placeholder page. V8 coverage is reported but not forced to an artificial 100%
threshold.

Playwright runs a Chromium smoke test against the local application. It verifies the
root route, heading, language, white canvas, health response, and not-found experience.
Tests do not need external internet access or production services.

PostgreSQL integration tests run against `TEST_DATABASE_URL`, never the application
database. The test runner copies that URL into its child process as both runtime and
migration connection, resets only the approved `siglum_test` database, applies reviewed
migrations, and seeds deterministic data. Authentication integration tests cover owner
bootstrap, last-owner protection, session revocation, MFA reset, public signup denial,
origin denial, generic failed login response, and cookie attributes. CI also verifies a
PostgreSQL 18.4 Compose stack and confirms the database readiness route before teardown.

Automated tests complement, rather than replace, manual accessibility review, security
review, and visual review when UI work begins.
