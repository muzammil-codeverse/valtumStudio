"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/database";

import {
  entryText,
  interpretInvoiceTransition,
  recordId
} from "../domain/collaboration";
import { authorizeDeliveryProject } from "./collaboration-access";
import {
  deliveryUrl,
  formValue,
  parseDeliveryDate,
  refreshDelivery
} from "./delivery-action-helpers";

export async function updateClientInvoiceAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } = await authorizeDeliveryProject(
    engagementId,
    "manage"
  );
  if (customer) throw new Error("Only the studio can record payment status.");
  const invoiceId = recordId.parse(formValue(form, "invoiceId"));
  const newStatus = formValue(form, "status");
  const explanation = z
    .string()
    .trim()
    .min(8)
    .max(280)
    .parse(formValue(form, "reference"));
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.clientInvoice.findFirst({
      where: { id: invoiceId, engagementId },
      select: { status: true, reference: true }
    });
    if (!invoice) throw new Error("Invoice not found.");
    const status = interpretInvoiceTransition(invoice.status, newStatus);
    const result = await tx.clientInvoice.updateMany({
      where: { id: invoiceId, engagementId, status: "ISSUED" },
      data: {
        status,
        paymentReference: explanation,
        paidAt: status === "PAID" ? new Date() : null
      }
    });
    if (result.count !== 1) throw new Error("Invoice changed while saving.");
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: status === "PAID" ? "INVOICE_MARKED_PAID" : "INVOICE_VOIDED",
        entityId: invoiceId,
        summary:
          status === "PAID"
            ? "Invoice " + invoice.reference + " marked paid"
            : "Invoice " + invoice.reference + " voided"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, false) + "#billing");
}

export async function updateDeliveryPlanAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } = await authorizeDeliveryProject(
    engagementId,
    "manage"
  );
  if (customer) throw new Error("Only the studio can update project plans.");
  const title = entryText(160).parse(formValue(form, "title"));
  const summary = z.string().trim().max(3000).parse(formValue(form, "summary"));
  const startDate = parseDeliveryDate(formValue(form, "startDate"));
  const targetDate = parseDeliveryDate(formValue(form, "targetDate"));
  if (startDate && targetDate && startDate > targetDate) {
    throw new Error("Target date must not precede start date.");
  }
  await prisma.$transaction(async (tx) => {
    await tx.clientEngagement.update({
      where: { id: engagementId },
      data: { title, summary: summary || null, startDate, targetDate }
    });
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: "PROJECT_PLAN_UPDATED",
        entityId: engagementId,
        summary: "Project plan updated"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, false));
}

export async function editDeliveryItemAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } = await authorizeDeliveryProject(
    engagementId,
    "manage"
  );
  if (customer) throw new Error("Only the studio can edit delivery items.");
  const itemId = recordId.parse(formValue(form, "itemId"));
  const kind = z.enum(["task", "milestone"]).parse(formValue(form, "kind"));
  const title = entryText(160).parse(formValue(form, "title"));
  const description = z.string().trim().max(4000).parse(formValue(form, "description"));
  const revision = z.coerce
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .parse(formValue(form, "revision"));
  const dueDate = parseDeliveryDate(formValue(form, "dueDate"));
  await prisma.$transaction(async (tx) => {
    const data = {
      title,
      description: description || null,
      dueDate,
      revision: { increment: 1 }
    };
    const changed =
      kind === "task"
        ? await tx.clientTask.updateMany({
            where: { id: itemId, engagementId, revision },
            data
          })
        : await tx.clientMilestone.updateMany({
            where: { id: itemId, engagementId, revision },
            data: { ...data, contentRevision: { increment: 1 } }
          });
    if (changed.count !== 1) {
      throw new Error("Item changed. Refresh before saving.");
    }
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: kind === "task" ? "TASK_EDITED" : "MILESTONE_EDITED",
        entityId: itemId,
        summary: kind === "task" ? "Task updated" : "Milestone updated"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, false));
}
