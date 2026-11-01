"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/database";
import { auth } from "@/modules/auth/server/auth";
import { requirePermission } from "@/modules/auth/server/authorization";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";

function assertEnabled(): void {
  if (!isClientPortalEnabled()) {
    throw new Error("The client workspace is not enabled.");
  }
}

const text = (max: number) => z.string().trim().min(2).max(max);
const idSchema = z.string().min(8).max(128);
const optionalText = (max: number) => z.string().trim().max(max).optional();

function parseDate(raw: FormDataEntryValue | null): Date | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  if (!/^20[0-9]{2}-[01][0-9]-[0-3][0-9]$/.test(raw)) throw new Error("Invalid date.");
  const date = new Date(raw + "T12:00:00.000Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new Error("Invalid date.");
  }
  return date;
}

function stringValue(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

async function authorizeClients() {
  assertEnabled();
  return requirePermission(await headers(), "clients", "manage");
}

export async function createClientWorkspaceAction(form: FormData): Promise<void> {
  await authorizeClients();
  const name = text(100).parse(stringValue(form, "name"));
  const slug = "studio-" + randomUUID().replaceAll("-", "").slice(0, 16);
  const workspace = await prisma.clientWorkspace.create({ data: { name, slug } });
  revalidatePath("/admin/clients");
  redirect("/admin/clients/" + workspace.id);
}

export async function addExistingClientAction(form: FormData): Promise<void> {
  await authorizeClients();
  const workspaceId = idSchema.parse(stringValue(form, "workspaceId"));
  const email = z.email().parse(stringValue(form, "email").trim().toLowerCase());
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, banned: true }
  });
  if (!user || user.role !== "client" || user.banned) {
    redirect("/admin/clients/" + workspaceId + "?notice=client-account-required");
  }
  await prisma.clientMembership.upsert({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
    update: {},
    create: { workspaceId, userId: user.id, role: "CLIENT_MEMBER" }
  });
  revalidatePath("/admin/clients/" + workspaceId);
  redirect("/admin/clients/" + workspaceId + "?notice=member-added");
}

export async function provisionClientAction(form: FormData): Promise<void> {
  assertEnabled();
  await requirePermission(await headers(), "users", "create");
  const workspaceId = idSchema.parse(stringValue(form, "workspaceId"));
  const name = text(120).parse(stringValue(form, "name"));
  const email = z.email().parse(stringValue(form, "email").trim().toLowerCase());
  const password = z.string().min(14).max(128).parse(stringValue(form, "password"));
  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (exists) redirect("/admin/clients/" + workspaceId + "?notice=user-exists");
  const result = await auth.api.createUser({
    headers: await headers(),
    body: { email, name, password, role: "client" }
  });
  const id = result.user.id;
  await prisma.clientMembership.create({
    data: { workspaceId, userId: id, role: "CLIENT_MEMBER" }
  });
  revalidatePath("/admin/clients/" + workspaceId);
  redirect("/admin/clients/" + workspaceId + "?notice=client-created");
}

export async function createEngagementAction(form: FormData): Promise<void> {
  await authorizeClients();
  const workspaceId = idSchema.parse(stringValue(form, "workspaceId"));
  const title = text(160).parse(stringValue(form, "title"));
  const summary = optionalText(2000).parse(stringValue(form, "summary"));
  const result = await prisma.clientEngagement.create({
    data: { workspaceId, title, summary: summary || null }
  });
  revalidatePath("/admin/clients/" + workspaceId);
  redirect("/admin/clients/" + workspaceId + "?project=" + result.id);
}

export async function addMilestoneAction(form: FormData): Promise<void> {
  await authorizeClients();
  const engagementId = idSchema.parse(stringValue(form, "engagementId"));
  const title = text(160).parse(stringValue(form, "title"));
  const dueDate = parseDate(form.get("dueDate"));
  const engagement = await prisma.clientEngagement.findUniqueOrThrow({
    where: { id: engagementId },
    select: { workspaceId: true, _count: { select: { milestones: true } } }
  });
  await prisma.clientMilestone.create({
    data: {
      engagementId,
      title,
      dueDate,
      sortOrder: engagement._count.milestones
    }
  });
  revalidatePath("/admin/clients/" + engagement.workspaceId);
  redirect("/admin/clients/" + engagement.workspaceId + "?project=" + engagementId);
}

export async function addClientTaskAction(form: FormData): Promise<void> {
  await authorizeClients();
  const engagementId = idSchema.parse(stringValue(form, "engagementId"));
  const title = text(160).parse(stringValue(form, "title"));
  const dueDate = parseDate(form.get("dueDate"));
  const engagement = await prisma.clientEngagement.findUniqueOrThrow({
    where: { id: engagementId },
    select: { workspaceId: true, _count: { select: { tasks: true } } }
  });
  await prisma.clientTask.create({
    data: {
      engagementId,
      title,
      dueDate,
      sortOrder: engagement._count.tasks
    }
  });
  revalidatePath("/admin/clients/" + engagement.workspaceId);
  redirect("/admin/clients/" + engagement.workspaceId + "?project=" + engagementId);
}

function parseCents(value: string): number {
  if (!/^(0|[1-9][0-9]{0,8})(?:\.[0-9]{1,2})?$/.test(value)) {
    throw new Error("Enter a valid nonnegative invoice amount.");
  }
  const parts = value.split(".");
  return Number(parts[0]) * 100 + Number((parts[1] ?? "").padEnd(2, "0"));
}

export async function createInvoiceAction(form: FormData): Promise<void> {
  await authorizeClients();
  const engagementId = idSchema.parse(stringValue(form, "engagementId"));
  const reference = text(80).parse(stringValue(form, "reference"));
  const currency = z
    .enum(["AUD", "USD", "GBP", "EUR", "AED", "SAR"])
    .parse(stringValue(form, "currency"));
  const amountCents = parseCents(stringValue(form, "amount"));
  const dueDate = parseDate(form.get("dueDate"));
  const engagement = await prisma.clientEngagement.findUniqueOrThrow({
    where: { id: engagementId },
    select: { workspaceId: true }
  });
  // Invoices are drafts until an authorized operator explicitly issues them.
  await prisma.clientInvoice.create({
    data: { engagementId, reference, currency, amountCents, dueDate }
  });
  revalidatePath("/admin/clients/" + engagement.workspaceId);
  redirect("/admin/clients/" + engagement.workspaceId + "?project=" + engagementId);
}

export async function issueInvoiceAction(form: FormData): Promise<void> {
  await authorizeClients();
  const id = idSchema.parse(stringValue(form, "invoiceId"));
  const invoice = await prisma.clientInvoice.findUniqueOrThrow({
    where: { id },
    select: {
      status: true,
      engagementId: true,
      engagement: { select: { workspaceId: true } }
    }
  });
  if (invoice.status !== "DRAFT") throw new Error("Only draft invoices can be issued.");
  await prisma.clientInvoice.update({
    where: { id },
    data: { status: "ISSUED", issuedAt: new Date() }
  });
  revalidatePath("/admin/clients/" + invoice.engagement.workspaceId);
  redirect(
    "/admin/clients/" +
      invoice.engagement.workspaceId +
      "?project=" +
      invoice.engagementId
  );
}

export async function postClientUpdateAction(form: FormData): Promise<void> {
  await authorizeClients();
  const engagementId = idSchema.parse(stringValue(form, "engagementId"));
  const title = text(160).parse(stringValue(form, "title"));
  const body = z.string().trim().min(10).max(10000).parse(stringValue(form, "body"));
  const engagement = await prisma.clientEngagement.findUniqueOrThrow({
    where: { id: engagementId },
    select: { workspaceId: true }
  });
  await prisma.clientUpdate.create({
    data: { engagementId, title, body, publishedAt: new Date() }
  });
  revalidatePath("/admin/clients/" + engagement.workspaceId);
  redirect("/admin/clients/" + engagement.workspaceId + "?project=" + engagementId);
}

const engagementStates = [
  "PLANNING",
  "ACTIVE",
  "REVIEW",
  "COMPLETE",
  "ON_HOLD"
] as const;

export async function changeEngagementStateAction(form: FormData): Promise<void> {
  await authorizeClients();
  const engagementId = idSchema.parse(stringValue(form, "engagementId"));
  const status = z.enum(engagementStates).parse(stringValue(form, "status"));
  const engagement = await prisma.clientEngagement.update({
    where: { id: engagementId },
    data: { status },
    select: { workspaceId: true }
  });
  revalidatePath("/admin/clients/" + engagement.workspaceId);
  redirect("/admin/clients/" + engagement.workspaceId + "?project=" + engagementId);
}

export async function changeMilestoneStateAction(form: FormData): Promise<void> {
  await authorizeClients();
  const id = idSchema.parse(stringValue(form, "milestoneId"));
  const status = z
    .enum(["PLANNED", "IN_PROGRESS", "AWAITING_REVIEW", "APPROVED", "COMPLETE"])
    .parse(stringValue(form, "status"));
  const record = await prisma.clientMilestone.update({
    where: { id },
    data: {
      status,
      completedAt: status === "COMPLETE" || status === "APPROVED" ? new Date() : null
    },
    select: { engagementId: true, engagement: { select: { workspaceId: true } } }
  });
  revalidatePath("/admin/clients/" + record.engagement.workspaceId);
  redirect(
    "/admin/clients/" +
      record.engagement.workspaceId +
      "?project=" +
      record.engagementId
  );
}

export async function changeTaskStateAction(form: FormData): Promise<void> {
  await authorizeClients();
  const id = idSchema.parse(stringValue(form, "taskId"));
  const status = z
    .enum(["OPEN", "IN_PROGRESS", "BLOCKED", "DONE"])
    .parse(stringValue(form, "status"));
  const record = await prisma.clientTask.update({
    where: { id },
    data: { status },
    select: { engagementId: true, engagement: { select: { workspaceId: true } } }
  });
  revalidatePath("/admin/clients/" + record.engagement.workspaceId);
  redirect(
    "/admin/clients/" +
      record.engagement.workspaceId +
      "?project=" +
      record.engagementId
  );
}
