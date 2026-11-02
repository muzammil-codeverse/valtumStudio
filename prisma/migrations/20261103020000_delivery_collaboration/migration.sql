-- Customer accounts are a supported authentication role. The inherited
-- user_role_check omitted client even though the application and the phase-one
-- customer-registration defaults use this role.
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_role_check";
ALTER TABLE "user" ADD CONSTRAINT "user_role_check"
  CHECK ("role" IS NULL OR "role" IN ('owner', 'admin', 'editor', 'client'));

-- Phase 2 adds verified customer collaboration records without changing existing data.
-- Production migration requires a tested restorable backup.
CREATE TYPE "ClientDecisionStatus" AS ENUM ('REQUESTED','APPROVED','CHANGES_REQUESTED','CANCELLED');
CREATE TYPE "ClientFileStatus" AS ENUM ('UPLOADING','READY','FAILED');

ALTER TABLE "client_invoices" ADD COLUMN "payment_reference" TEXT;
ALTER TABLE "client_tasks" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "client_milestones" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "client_milestones" ADD COLUMN "content_revision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "client_decisions" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "milestone_id" TEXT,
  "milestone_revision" INTEGER,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "ClientDecisionStatus" NOT NULL DEFAULT 'REQUESTED',
  "due_date" TIMESTAMP(3),
  "requested_by_user_id" TEXT NOT NULL,
  "responded_by_user_id" TEXT,
  "response_note" TEXT,
  "responded_at" TIMESTAMP(3),
  "revision" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_decisions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "client_decisions_engagement_id_status_created_at_idx" ON "client_decisions"("engagement_id","status","created_at");
CREATE INDEX "client_decisions_milestone_id_idx" ON "client_decisions"("milestone_id");
ALTER TABLE "client_decisions" ADD CONSTRAINT "client_decisions_engagement_id_fkey"
  FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_decisions" ADD CONSTRAINT "client_decisions_milestone_id_fkey"
  FOREIGN KEY ("milestone_id") REFERENCES "client_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_decisions" ADD CONSTRAINT "client_decisions_requested_by_user_id_fkey"
  FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_decisions" ADD CONSTRAINT "client_decisions_responded_by_user_id_fkey"
  FOREIGN KEY ("responded_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "client_messages" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "task_id" TEXT,
  "author_user_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "client_messages_engagement_id_created_at_idx" ON "client_messages"("engagement_id","created_at");
CREATE INDEX "client_messages_task_id_created_at_idx" ON "client_messages"("task_id","created_at");
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_engagement_id_fkey"
  FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_task_id_fkey"
  FOREIGN KEY ("task_id") REFERENCES "client_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "client_files" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "uploader_user_id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "checksum_sha256" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "status" "ClientFileStatus" NOT NULL DEFAULT 'UPLOADING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_files_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "client_files_storage_key_key" ON "client_files"("storage_key");
CREATE INDEX "client_files_engagement_id_status_created_at_idx" ON "client_files"("engagement_id","status","created_at");
CREATE INDEX "client_files_uploader_user_id_created_at_idx" ON "client_files"("uploader_user_id","created_at");
ALTER TABLE "client_files" ADD CONSTRAINT "client_files_engagement_id_fkey"
  FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_files" ADD CONSTRAINT "client_files_uploader_user_id_fkey"
  FOREIGN KEY ("uploader_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "client_delivery_events" (
  "id" TEXT NOT NULL,
  "engagement_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "visible_to_client" BOOLEAN NOT NULL DEFAULT true,
  "kind" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_delivery_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "client_delivery_events_engagement_id_created_at_idx" ON "client_delivery_events"("engagement_id","created_at");
ALTER TABLE "client_delivery_events" ADD CONSTRAINT "client_delivery_events_engagement_id_fkey"
  FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_delivery_events" ADD CONSTRAINT "client_delivery_events_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
