"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/database";

import {
  decisionResponse,
  entryText,
  recordId,
  validateDecisionNote
} from "../domain/collaboration";
import { authorizeDeliveryProject, membershipFilter } from "./collaboration-access";
import {
  deliveryUrl,
  formValue,
  parseDeliveryDate,
  refreshDelivery
} from "./delivery-action-helpers";

export async function requestClientDecisionAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } = await authorizeDeliveryProject(
    engagementId,
    "manage"
  );
  if (customer) throw new Error("Only the studio can request an approval.");
  const title = entryText(160).parse(formValue(form, "title"));
  const description = z
    .string()
    .trim()
    .min(10)
    .max(4000)
    .parse(formValue(form, "description"));
  const rawMilestone = formValue(form, "milestoneId");
  const milestoneId = rawMilestone ? recordId.parse(rawMilestone) : null;
  const dueDate = parseDeliveryDate(formValue(form, "dueDate"));

  await prisma.$transaction(async (tx) => {
    const milestone = milestoneId
      ? await tx.clientMilestone.findFirst({
          where: { id: milestoneId, engagementId },
          select: { id: true, contentRevision: true }
        })
      : null;
    if (milestoneId && !milestone) {
      throw new Error("This milestone does not belong to the project.");
    }
    const decision = await tx.clientDecision.create({
      data: {
        engagementId,
        milestoneId,
        milestoneRevision: milestone?.contentRevision ?? null,
        title,
        description,
        dueDate,
        requestedByUserId: principal.userId
      }
    });
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: "APPROVAL_REQUESTED",
        entityId: decision.id,
        summary: "Customer approval requested: " + title
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, false) + "#approvals");
}

export async function respondClientDecisionAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } =
    await authorizeDeliveryProject(engagementId);
  if (!customer) throw new Error("Only an authorized customer can respond.");
  const id = recordId.parse(formValue(form, "decisionId"));
  const status = decisionResponse.parse(formValue(form, "status"));
  const note = validateDecisionNote(status, formValue(form, "responseNote"));
  const revision = z.coerce
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .parse(formValue(form, "revision"));
  await prisma.$transaction(async (tx) => {
    const pending = await tx.clientDecision.findFirst({
      where: {
        id,
        engagementId,
        status: "REQUESTED",
        engagement: membershipFilter(principal.userId)
      },
      select: {
        milestoneRevision: true,
        milestone: { select: { contentRevision: true } }
      }
    });
    if (!pending) throw new Error("Approval request is no longer available.");
    if (
      pending.milestone &&
      pending.milestoneRevision !== pending.milestone.contentRevision
    ) {
      throw new Error(
        "The milestone changed. Ask the studio to issue a fresh approval."
      );
    }
    const updated = await tx.clientDecision.updateMany({
      where: {
        id,
        engagementId,
        revision,
        status: "REQUESTED",
        engagement: membershipFilter(principal.userId),
        ...(pending.milestone
          ? {
              milestone: { is: { contentRevision: pending.milestone.contentRevision } }
            }
          : {})
      },
      data: {
        status,
        responseNote: note || null,
        respondedByUserId: principal.userId,
        respondedAt: new Date(),
        revision: { increment: 1 }
      }
    });
    if (updated.count !== 1) {
      throw new Error("This approval request changed. Refresh before responding.");
    }
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: status === "APPROVED" ? "APPROVAL_GRANTED" : "CHANGES_REQUESTED",
        entityId: id,
        summary:
          status === "APPROVED"
            ? "Customer approved a decision"
            : "Customer requested revisions"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, true) + "#approvals");
}

export async function cancelClientDecisionAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } = await authorizeDeliveryProject(
    engagementId,
    "manage"
  );
  if (customer) throw new Error("Only the studio can withdraw an approval.");
  const id = recordId.parse(formValue(form, "decisionId"));
  await prisma.$transaction(async (tx) => {
    const result = await tx.clientDecision.updateMany({
      where: { id, engagementId, status: "REQUESTED" },
      data: { status: "CANCELLED", revision: { increment: 1 } }
    });
    if (result.count !== 1) throw new Error("Request is no longer pending.");
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: "APPROVAL_WITHDRAWN",
        entityId: id,
        summary: "Approval request withdrawn"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(deliveryUrl(engagement.workspaceId, engagementId, false) + "#approvals");
}
