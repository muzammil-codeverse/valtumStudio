-- Preserve existing account roles and password-change state.
-- Only the default for newly inserted customers changes.
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'client';
ALTER TABLE "user" ALTER COLUMN "mustChangePassword" SET DEFAULT false;
