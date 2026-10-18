-- Phase 6 CRM foundation. Generated from the connected development schema with
-- `prisma migrate diff`; this migration is intentionally not applied by this task.

CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "LeadProjectType" AS ENUM ('WEBSITE', 'WEB_APPLICATION', 'INTERNAL_BUSINESS_SYSTEM', 'MARKETPLACE_OR_BOOKING_PLATFORM', 'AI_OR_AUTOMATION', 'DATA_OR_ANALYTICS', 'COMPUTER_VISION', 'ANDROID_OR_FLUTTER', 'BLOCKCHAIN_OR_WEB3', 'EXISTING_PRODUCT_IMPROVEMENT', 'NOT_SURE', 'OTHER');
CREATE TYPE "LeadProjectStage" AS ENUM ('IDEA', 'DISCOVERY', 'DESIGN', 'IN_DEVELOPMENT', 'EXISTING_PRODUCT', 'LAUNCH_OR_GROWTH', 'NOT_SURE', 'OTHER');
CREATE TYPE "LeadBudgetRange" AS ENUM ('UNDER_AUD_5000', 'AUD_5000_TO_10000', 'AUD_10000_TO_25000', 'AUD_25000_TO_50000', 'AUD_50000_PLUS', 'NOT_SURE');
CREATE TYPE "LeadTimeline" AS ENUM ('AS_SOON_AS_POSSIBLE', 'ONE_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'SIX_MONTHS_PLUS', 'FLEXIBLE', 'NOT_SURE');
CREATE TYPE "LeadServiceInterest" AS ENUM ('WEBSITES', 'WEB_APPLICATIONS', 'BACKEND_OR_API_ENGINEERING', 'ANDROID_OR_FLUTTER', 'AI_AND_AUTOMATION', 'DATA_AND_ANALYTICS', 'COMPUTER_VISION', 'BLOCKCHAIN_AND_WEB3', 'TECHNICAL_CONSULTING', 'NOT_SURE');
CREATE TYPE "LeadActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'NOTE_ADDED', 'MARKED_SPAM', 'ARCHIVED', 'RESTORED');

ALTER TYPE "AuditAction" ADD VALUE 'LEAD_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_PRIORITY_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_NOTE_ADDED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAD_MARKED_SPAM';

ALTER TYPE "LeadStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "LeadStatus" ADD VALUE 'DISCOVERY';
ALTER TYPE "LeadStatus" ADD VALUE 'PROPOSAL';
ALTER TYPE "LeadStatus" ADD VALUE 'WON';
ALTER TYPE "LeadStatus" ADD VALUE 'LOST';
ALTER TYPE "LeadStatus" ADD VALUE 'SPAM';

-- The Phase 2 email unique index conflicts with legitimate later enquiries.
DROP INDEX "leads_email_key";

ALTER TABLE "leads"
  ADD COLUMN "archived_at" TIMESTAMP(3),
  ADD COLUMN "assignee_user_id" TEXT,
  ADD COLUMN "budget_range" "LeadBudgetRange",
  ADD COLUMN "consent_version" TEXT NOT NULL DEFAULT 'legacy-unknown',
  ADD COLUMN "contacted_at" TIMESTAMP(3),
  ADD COLUMN "desired_outcome" TEXT,
  ADD COLUMN "duplicate_fingerprint" TEXT,
  ADD COLUMN "existing_product_url" TEXT,
  ADD COLUMN "landing_page_url" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "lost_at" TIMESTAMP(3),
  ADD COLUMN "priority" "LeadPriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "project_stage" "LeadProjectStage" NOT NULL DEFAULT 'NOT_SURE',
  ADD COLUMN "project_summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "project_type" "LeadProjectType" NOT NULL DEFAULT 'NOT_SURE',
  ADD COLUMN "qualified_at" TIMESTAMP(3),
  ADD COLUMN "referral_source" TEXT,
  ADD COLUMN "referrer_url" TEXT,
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "source_detail" TEXT,
  ADD COLUMN "spam_at" TIMESTAMP(3),
  ADD COLUMN "timeline" "LeadTimeline",
  ADD COLUMN "utm_campaign" TEXT,
  ADD COLUMN "utm_content" TEXT,
  ADD COLUMN "utm_medium" TEXT,
  ADD COLUMN "utm_source" TEXT,
  ADD COLUMN "utm_term" TEXT,
  ADD COLUMN "won_at" TIMESTAMP(3),
  ALTER COLUMN "source" SET DEFAULT 'WEBSITE_CONTACT';

UPDATE "leads"
SET "project_summary" = COALESCE(NULLIF(BTRIM("message"), ''), '')
WHERE "project_summary" = '';

CREATE TABLE "lead_service_interests" (
  "lead_id" TEXT NOT NULL,
  "interest" "LeadServiceInterest" NOT NULL,
  CONSTRAINT "lead_service_interests_pkey" PRIMARY KEY ("lead_id", "interest")
);

CREATE TABLE "lead_notes" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "author_user_id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_activities" (
  "id" TEXT NOT NULL,
  "lead_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "type" "LeadActivityType" NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_rate_limit_buckets" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "bucket_key" TEXT NOT NULL,
  "window_started_at" TIMESTAMP(3) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "blocked_until" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_duplicate_windows" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "window_start" TIMESTAMP(3) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_duplicate_windows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_notes_lead_id_created_at_idx" ON "lead_notes"("lead_id", "created_at");
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities"("lead_id", "created_at");
CREATE INDEX "lead_rate_limit_buckets_expires_at_idx" ON "lead_rate_limit_buckets"("expires_at");
CREATE UNIQUE INDEX "lead_rate_limit_buckets_scope_bucket_key_window_started_at_key" ON "lead_rate_limit_buckets"("scope", "bucket_key", "window_started_at");
CREATE INDEX "lead_duplicate_windows_expires_at_idx" ON "lead_duplicate_windows"("expires_at");
CREATE UNIQUE INDEX "lead_duplicate_windows_fingerprint_window_start_key" ON "lead_duplicate_windows"("fingerprint", "window_start");
CREATE INDEX "leads_archived_at_created_at_idx" ON "leads"("archived_at", "created_at");
CREATE INDEX "leads_assignee_user_id_created_at_idx" ON "leads"("assignee_user_id", "created_at");
CREATE INDEX "leads_priority_created_at_idx" ON "leads"("priority", "created_at");
CREATE INDEX "leads_source_created_at_idx" ON "leads"("source", "created_at");
CREATE INDEX "leads_duplicate_fingerprint_created_at_idx" ON "leads"("duplicate_fingerprint", "created_at");

ALTER TABLE "leads" ADD CONSTRAINT "leads_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_service_interests" ADD CONSTRAINT "lead_service_interests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
