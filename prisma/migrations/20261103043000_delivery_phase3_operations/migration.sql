-- A claim state prevents concurrent signed-upload finalizers from racing.
ALTER TYPE "ClientFileStatus" ADD VALUE IF NOT EXISTS 'VERIFYING';

-- Phase 3 notification read state and scalable, stable activity pagination.
-- Notification state is private to an authenticated user. No activity content is copied.
CREATE TABLE "client_activity_read_state" (
  "user_id" TEXT NOT NULL,
  "last_seen_at" TIMESTAMP(3) NOT NULL,
  "last_seen_id" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_activity_read_state_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE "client_activity_read_state"
  ADD CONSTRAINT "client_activity_read_state_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "client_decisions_engagement_id_created_at_id_idx"
  ON "client_decisions"("engagement_id", "created_at", "id");
CREATE INDEX "client_messages_engagement_id_created_at_id_idx"
  ON "client_messages"("engagement_id", "created_at", "id");
CREATE INDEX "client_files_engagement_id_created_at_id_idx"
  ON "client_files"("engagement_id", "created_at", "id");
CREATE INDEX "client_delivery_events_engagement_id_created_at_id_idx"
  ON "client_delivery_events"("engagement_id", "created_at", "id");
CREATE INDEX "client_delivery_events_created_at_id_idx"
  ON "client_delivery_events"("created_at", "id");


ALTER TABLE "client_files" ADD COLUMN "storage_deleted_at" TIMESTAMP(3);
CREATE INDEX "client_files_status_expires_at_storage_deleted_at_idx"
  ON "client_files"("status", "expires_at", "storage_deleted_at");


ALTER TABLE "client_files" ADD COLUMN "scan_completed_at" TIMESTAMP(3);
ALTER TABLE "client_files" ADD COLUMN "upload_deleted_at" TIMESTAMP(3);
