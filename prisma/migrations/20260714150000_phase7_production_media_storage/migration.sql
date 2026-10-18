-- Phase 7 is additive. Existing ACTIVE records are retained as archived legacy
-- metadata because their binary contents cannot be retroactively verified.
-- PostgreSQL does not permit a value just added with ALTER TYPE to be used as
-- a default in the same transactional migration. Replace this one enum type
-- without touching table data so the new PENDING_UPLOAD default is safe.
CREATE TYPE "MediaStatus_phase7" AS ENUM (
  'ACTIVE',
  'PENDING_UPLOAD',
  'VERIFYING',
  'READY',
  'FAILED',
  'ARCHIVED',
  'DELETION_PENDING',
  'DELETED'
);

ALTER TABLE "media_assets" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "media_assets"
  ALTER COLUMN "status" TYPE "MediaStatus_phase7"
  USING ("status"::text::"MediaStatus_phase7");

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_UPLOAD_RESERVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_UPLOAD_FINALIZED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_UPLOAD_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_METADATA_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_RESTORED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_DELETION_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_DELETION_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_DELETION_FAILED';

ALTER TABLE "media_assets"
  ADD COLUMN "incoming_key" TEXT,
  ADD COLUMN "upload_request_token" TEXT,
  ADD COLUMN "declared_checksum" TEXT,
  ADD COLUMN "checksum" TEXT,
  ADD COLUMN "checksum_algorithm" TEXT,
  ADD COLUMN "verified_extension" TEXT,
  ADD COLUMN "credit" TEXT,
  ADD COLUMN "failure_code" TEXT,
  ADD COLUMN "failure_message" TEXT,
  ADD COLUMN "upload_expires_at" TIMESTAMP(3),
  ADD COLUMN "finalized_at" TIMESTAMP(3),
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

UPDATE "media_assets"
SET "status" = 'ARCHIVED', "archived_at" = COALESCE("archived_at", CURRENT_TIMESTAMP)
WHERE "status" = 'ACTIVE';

ALTER TABLE "media_assets" ALTER COLUMN "status" SET DEFAULT 'PENDING_UPLOAD';

DROP TYPE "MediaStatus";
ALTER TYPE "MediaStatus_phase7" RENAME TO "MediaStatus";

CREATE UNIQUE INDEX "media_assets_incoming_key_key" ON "media_assets"("incoming_key");
CREATE UNIQUE INDEX "media_assets_upload_request_token_key" ON "media_assets"("upload_request_token");
CREATE INDEX "media_assets_status_created_at_idx" ON "media_assets"("status", "created_at");
CREATE INDEX "media_assets_archived_at_created_at_idx" ON "media_assets"("archived_at", "created_at");
CREATE INDEX "media_assets_created_by_id_created_at_idx" ON "media_assets"("created_by_id", "created_at");
CREATE INDEX "media_assets_upload_expires_at_idx" ON "media_assets"("upload_expires_at");
CREATE INDEX "media_assets_checksum_status_idx" ON "media_assets"("checksum", "status");
