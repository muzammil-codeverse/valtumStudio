-- Isolated customer portal schema. Additive: no changes to existing content or lead tables.
CREATE TYPE "ClientEngagementStatus" AS ENUM ('PLANNING', 'ACTIVE', 'REVIEW', 'COMPLETE', 'ON_HOLD');
CREATE TYPE "ClientMilestoneStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'AWAITING_REVIEW', 'APPROVED', 'COMPLETE');
CREATE TYPE "ClientTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE');
CREATE TYPE "ClientInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');
CREATE TYPE "ClientMembershipRole" AS ENUM ('CLIENT_OWNER', 'CLIENT_MEMBER');

CREATE TABLE "client_workspaces" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_workspaces_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "client_memberships" (
  "id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "user_id" TEXT NOT NULL,
  "role" "ClientMembershipRole" NOT NULL DEFAULT 'CLIENT_MEMBER',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_memberships_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "client_engagements" (
  "id" TEXT NOT NULL, "workspace_id" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT,
  "status" "ClientEngagementStatus" NOT NULL DEFAULT 'PLANNING',
  "start_date" TIMESTAMP(3), "target_date" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_engagements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "client_milestones" (
  "id" TEXT NOT NULL, "engagement_id" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "status" "ClientMilestoneStatus" NOT NULL DEFAULT 'PLANNED',
  "due_date" TIMESTAMP(3), "completed_at" TIMESTAMP(3), "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_milestones_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "client_tasks" (
  "id" TEXT NOT NULL, "engagement_id" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "status" "ClientTaskStatus" NOT NULL DEFAULT 'OPEN',
  "due_date" TIMESTAMP(3), "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_tasks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "client_invoices" (
  "id" TEXT NOT NULL, "engagement_id" TEXT NOT NULL, "reference" TEXT NOT NULL,
  "description" TEXT, "currency" TEXT NOT NULL DEFAULT 'AUD',
  "amount_cents" INTEGER NOT NULL,
  "status" "ClientInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "issued_at" TIMESTAMP(3), "due_date" TIMESTAMP(3), "paid_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "client_invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_invoices_positive_amount" CHECK ("amount_cents" >= 0),
  CONSTRAINT "client_invoices_iso_currency" CHECK ("currency" ~ '^[A-Z]{3}$')
);
CREATE TABLE "client_updates" (
  "id" TEXT NOT NULL, "engagement_id" TEXT NOT NULL, "title" TEXT NOT NULL,
  "body" TEXT NOT NULL, "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_updates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "client_workspaces_slug_key" ON "client_workspaces"("slug");
CREATE UNIQUE INDEX "client_memberships_workspace_id_user_id_key" ON "client_memberships"("workspace_id","user_id");
CREATE INDEX "client_memberships_user_id_workspace_id_idx" ON "client_memberships"("user_id","workspace_id");
CREATE INDEX "client_engagements_workspace_id_status_idx" ON "client_engagements"("workspace_id","status");
CREATE INDEX "client_milestones_engagement_id_sort_order_idx" ON "client_milestones"("engagement_id","sort_order");
CREATE INDEX "client_milestones_due_date_idx" ON "client_milestones"("due_date");
CREATE INDEX "client_tasks_engagement_id_status_idx" ON "client_tasks"("engagement_id","status");
CREATE INDEX "client_tasks_due_date_idx" ON "client_tasks"("due_date");
CREATE UNIQUE INDEX "client_invoices_engagement_id_reference_key" ON "client_invoices"("engagement_id","reference");
CREATE INDEX "client_invoices_engagement_id_status_idx" ON "client_invoices"("engagement_id","status");
CREATE INDEX "client_invoices_due_date_idx" ON "client_invoices"("due_date");
CREATE INDEX "client_updates_engagement_id_published_at_idx" ON "client_updates"("engagement_id","published_at");
ALTER TABLE "client_memberships" ADD CONSTRAINT "client_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "client_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_memberships" ADD CONSTRAINT "client_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_engagements" ADD CONSTRAINT "client_engagements_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "client_workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_milestones" ADD CONSTRAINT "client_milestones_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_invoices" ADD CONSTRAINT "client_invoices_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_updates" ADD CONSTRAINT "client_updates_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "client_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
