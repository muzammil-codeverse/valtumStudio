-- The Better Auth tables below were generated with auth@1.6.23 from the
-- pinned server configuration, then reviewed before this Prisma migration.
-- Prisma Migrate remains the deployment authority.

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('OWNER_BOOTSTRAPPED', 'ACCOUNT_CREATED', 'SIGN_IN_SUCCEEDED', 'SIGN_IN_FAILED', 'ACCOUNT_TEMPORARILY_LOCKED', 'TWO_FACTOR_CHALLENGE_SUCCEEDED', 'TWO_FACTOR_CHALLENGE_FAILED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'RECOVERY_CODE_USED', 'PASSWORD_CHANGED', 'PASSWORD_RESET_BY_OPERATOR', 'SESSION_REVOKED', 'OTHER_SESSIONS_REVOKED', 'SIGN_OUT', 'ROLE_CHANGED', 'ACCOUNT_BANNED', 'ACCOUNT_UNBANNED', 'UNAUTHORIZED_ACCESS_DENIED', 'UNTRUSTED_ORIGIN_REJECTED');
CREATE TYPE "SecurityEventOutcome" AS ENUM ('SUCCEEDED', 'FAILED', 'DENIED');
CREATE TYPE "SecurityEventSeverity" AS ENUM ('INFO', 'WARNING', 'HIGH', 'CRITICAL');

-- Better Auth generated tables
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "role" TEXT DEFAULT 'editor',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "lastPasswordChangedAt" TIMESTAMP(3),
    "lastSuccessfulLoginAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN DEFAULT true,
    "recoveryCodesAcknowledgedAt" TIMESTAMP(3),
    CONSTRAINT "user_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_role_check" CHECK ("role" IS NULL OR "role" IN ('owner', 'admin', 'editor'))
);

CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT true,
    "failedVerificationCount" INTEGER DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,
    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- Siglum application-owned security data
CREATE TABLE "auth_throttles" (
    "id" TEXT NOT NULL,
    "identifier_hash" TEXT NOT NULL,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "window_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_failure_at" TIMESTAMP(3),
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_throttles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "type" "SecurityEventType" NOT NULL,
    "outcome" "SecurityEventOutcome" NOT NULL,
    "severity" "SecurityEventSeverity" NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "identifier_hash" TEXT,
    "request_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "reason_code" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "security_events_reason_code_length_check" CHECK ("reason_code" IS NULL OR char_length("reason_code") <= 128),
    CONSTRAINT "security_events_user_agent_length_check" CHECK ("user_agent" IS NULL OR char_length("user_agent") <= 512)
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "twoFactor_secret_idx" ON "twoFactor"("secret");
CREATE INDEX "twoFactor_userId_idx" ON "twoFactor"("userId");
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");
CREATE UNIQUE INDEX "auth_throttles_identifier_hash_key" ON "auth_throttles"("identifier_hash");
CREATE INDEX "auth_throttles_locked_until_idx" ON "auth_throttles"("locked_until");
CREATE INDEX "security_events_user_id_created_at_idx" ON "security_events"("user_id", "created_at");
CREATE INDEX "security_events_type_created_at_idx" ON "security_events"("type", "created_at");
CREATE INDEX "security_events_severity_created_at_idx" ON "security_events"("severity", "created_at");
CREATE INDEX "security_events_identifier_hash_created_at_idx" ON "security_events"("identifier_hash", "created_at");

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
