"use server";

import { headers } from "next/headers";
import { z, ZodError } from "zod";

import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";
import { AuthorizationError } from "@/modules/auth/policies/authorization";
import {
  AuthenticationAssuranceError,
  AuthenticationError,
  requirePermission
} from "@/modules/auth/server/authorization";
import { invalidateLeadContent } from "@/modules/cms/shared/server/cache";
import {
  type ActionResult,
  failure,
  success
} from "@/modules/cms/shared/types/action-result";

import { leadPriorities, leadStatuses } from "../domain/submission";

const identitySchema = z.object({
  id: z.string().cuid(),
  revision: z.coerce.number().int().positive()
});
const noteSchema = identitySchema.extend({ body: z.string().trim().min(1).max(4000) });
const statusSchema = identitySchema.extend({ status: z.enum(leadStatuses) });
const prioritySchema = identitySchema.extend({ priority: z.enum(leadPriorities) });
const assignmentSchema = identitySchema.extend({
  assigneeUserId: z.string().trim().min(1).max(128).nullable()
});

class LeadActionError extends Error {
  public constructor(public readonly code: "CONFLICT" | "INVALID_STATE" | "NOT_FOUND") {
    super(code);
    this.name = "LeadActionError";
  }
}

function formObject(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData.entries());
}

function toLeadFailure(error: unknown): ActionResult<never> {
  if (error instanceof ZodError) {
    return failure("VALIDATION_ERROR", "Check the submitted values.");
  }
  if (
    error instanceof AuthenticationError ||
    error instanceof AuthenticationAssuranceError
  ) {
    return failure("UNAUTHORIZED", "Authentication is required.");
  }
  if (error instanceof AuthorizationError) {
    return failure("FORBIDDEN", "You do not have permission to do that.");
  }
  if (error instanceof LeadActionError) {
    if (error.code === "CONFLICT") {
      return failure(
        "CONFLICT",
        "This lead was updated by another administrator. Reload and try again."
      );
    }
    if (error.code === "NOT_FOUND") {
      return failure("NOT_FOUND", "This lead could not be found.");
    }
    return failure("INVALID_STATE", "This change is not valid for the current lead.");
  }
  return failure("INTERNAL_ERROR", "We could not save this change. Please try again.");
}

function milestoneUpdate(
  status: LeadStatus,
  now: Date
): Prisma.LeadUncheckedUpdateManyInput {
  switch (status) {
    case "CONTACTED":
      return { contactedAt: now };
    case "QUALIFIED":
      return { qualifiedAt: now };
    case "WON":
      return { wonAt: now };
    case "LOST":
      return { lostAt: now };
    case "SPAM":
      return { spamAt: now };
    default:
      return {};
  }
}

async function getCurrentLead(tx: Prisma.TransactionClient, id: string) {
  const current = await tx.lead.findUnique({ where: { id } });
  if (current === null) {
    throw new LeadActionError("NOT_FOUND");
  }
  return current;
}

async function updateOrConflict(
  tx: Prisma.TransactionClient,
  id: string,
  revision: number,
  data: Prisma.LeadUncheckedUpdateManyInput
): Promise<void> {
  const result = await tx.lead.updateMany({
    where: { id, revision },
    data: { ...data, revision: { increment: 1 } }
  });
  if (result.count !== 1) {
    throw new LeadActionError("CONFLICT");
  }
}

async function writeActivityAndAudit(
  tx: Prisma.TransactionClient,
  input: Readonly<{
    action:
      | "LEAD_ASSIGNED"
      | "LEAD_MARKED_SPAM"
      | "LEAD_NOTE_ADDED"
      | "LEAD_PRIORITY_CHANGED"
      | "LEAD_STATUS_CHANGED"
      | "ARCHIVED"
      | "RESTORED";
    actorUserId: string;
    activity:
      | "ARCHIVED"
      | "ASSIGNED"
      | "MARKED_SPAM"
      | "NOTE_ADDED"
      | "PRIORITY_CHANGED"
      | "RESTORED"
      | "STATUS_CHANGED"
      | "UNASSIGNED";
    id: string;
    metadata?: Prisma.InputJsonValue;
    summary: string;
  }>
): Promise<void> {
  await tx.leadActivity.create({
    data: {
      leadId: input.id,
      actorUserId: input.actorUserId,
      type: input.activity,
      ...(input.metadata === undefined ? {} : { metadata: input.metadata })
    }
  });
  await tx.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: "Lead",
      entityId: input.id,
      summary: input.summary,
      ...(input.metadata === undefined ? {} : { changes: input.metadata })
    }
  });
}

export async function changeLeadStatusAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const principal = await requirePermission(await headers(), "leads", "update");
    const input = statusSchema.parse(formObject(formData));
    const { id, revision, status } = input;
    await prisma.$transaction(async (tx) => {
      const current = await getCurrentLead(tx, id);
      if (current.archivedAt !== null || current.status === status) {
        throw new LeadActionError("INVALID_STATE");
      }
      const now = new Date();
      await updateOrConflict(tx, id, revision, {
        status,
        ...milestoneUpdate(status, now)
      });
      await writeActivityAndAudit(tx, {
        action: status === "SPAM" ? "LEAD_MARKED_SPAM" : "LEAD_STATUS_CHANGED",
        actorUserId: principal.userId,
        activity: status === "SPAM" ? "MARKED_SPAM" : "STATUS_CHANGED",
        id,
        metadata: { from: current.status, to: status },
        summary: `Changed lead status from ${current.status} to ${status}.`
      });
    });
    invalidateLeadContent(id);
    return success(undefined, "Lead status updated.");
  } catch (error) {
    return toLeadFailure(error);
  }
}

export async function changeLeadPriorityAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    const principal = await requirePermission(await headers(), "leads", "update");
    const input = prioritySchema.parse(formObject(formData));
    const { id, revision, priority } = input;
    await prisma.$transaction(async (tx) => {
      const current = await getCurrentLead(tx, id);
      if (current.archivedAt !== null || current.priority === priority) {
        throw new LeadActionError("INVALID_STATE");
      }
      await updateOrConflict(tx, id, revision, { priority });
      await writeActivityAndAudit(tx, {
        action: "LEAD_PRIORITY_CHANGED",
        actorUserId: principal.userId,
        activity: "PRIORITY_CHANGED",
        id,
        metadata: { from: current.priority, to: priority },
        summary: `Changed lead priority from ${current.priority} to ${priority}.`
      });
    });
    invalidateLeadContent(id);
    return success(undefined, "Lead priority updated.");
  } catch (error) {
    return toLeadFailure(error);
  }
}

export async function assignLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const principal = await requirePermission(await headers(), "leads", "manage");
    const input = assignmentSchema.parse({
      ...formObject(formData),
      assigneeUserId: formData.get("assigneeUserId") || null
    });
    const { assigneeUserId, id, revision } = input;
    await prisma.$transaction(async (tx) => {
      const current = await getCurrentLead(tx, id);
      if (current.archivedAt !== null || current.assigneeUserId === assigneeUserId) {
        throw new LeadActionError("INVALID_STATE");
      }
      if (assigneeUserId !== null) {
        const assignee = await tx.user.findFirst({
          where: {
            id: assigneeUserId,
            role: { in: ["owner", "admin"] },
            OR: [
              { banned: false },
              { banned: null },
              { banExpires: { lte: new Date() } }
            ]
          },
          select: { id: true }
        });
        if (assignee === null) {
          throw new LeadActionError("INVALID_STATE");
        }
      }
      await updateOrConflict(tx, id, revision, { assigneeUserId });
      await writeActivityAndAudit(tx, {
        action: "LEAD_ASSIGNED",
        actorUserId: principal.userId,
        activity: assigneeUserId === null ? "UNASSIGNED" : "ASSIGNED",
        id,
        metadata: { from: current.assigneeUserId, to: assigneeUserId },
        summary: assigneeUserId === null ? "Unassigned lead." : "Assigned lead."
      });
    });
    invalidateLeadContent(id);
    return success(undefined, "Lead assignment updated.");
  } catch (error) {
    return toLeadFailure(error);
  }
}

export async function addLeadNoteAction(formData: FormData): Promise<ActionResult> {
  try {
    const principal = await requirePermission(await headers(), "leads", "update");
    const input = noteSchema.parse(formObject(formData));
    const { body, id, revision } = input;
    await prisma.$transaction(async (tx) => {
      const current = await getCurrentLead(tx, id);
      if (current.archivedAt !== null) {
        throw new LeadActionError("INVALID_STATE");
      }
      await updateOrConflict(tx, id, revision, {});
      await tx.leadNote.create({
        data: { leadId: id, authorUserId: principal.userId, body }
      });
      await writeActivityAndAudit(tx, {
        action: "LEAD_NOTE_ADDED",
        actorUserId: principal.userId,
        activity: "NOTE_ADDED",
        id,
        summary: "Added an internal lead note."
      });
    });
    invalidateLeadContent(id);
    return success(undefined, "Internal note added.");
  } catch (error) {
    return toLeadFailure(error);
  }
}

export async function archiveLeadAction(formData: FormData): Promise<ActionResult> {
  return setLeadArchiveState(formData, true);
}

export async function restoreLeadAction(formData: FormData): Promise<ActionResult> {
  return setLeadArchiveState(formData, false);
}

async function setLeadArchiveState(
  formData: FormData,
  archive: boolean
): Promise<ActionResult> {
  try {
    const principal = await requirePermission(await headers(), "leads", "manage");
    const input = identitySchema.parse(formObject(formData));
    const { id, revision } = input;
    await prisma.$transaction(async (tx) => {
      const current = await getCurrentLead(tx, id);
      if ((current.archivedAt !== null) === archive) {
        throw new LeadActionError("INVALID_STATE");
      }
      await updateOrConflict(tx, id, revision, {
        archivedAt: archive ? new Date() : null
      });
      await writeActivityAndAudit(tx, {
        action: archive ? "ARCHIVED" : "RESTORED",
        actorUserId: principal.userId,
        activity: archive ? "ARCHIVED" : "RESTORED",
        id,
        summary: archive ? "Archived lead." : "Restored lead."
      });
    });
    invalidateLeadContent(id);
    return success(undefined, archive ? "Lead archived." : "Lead restored.");
  } catch (error) {
    return toLeadFailure(error);
  }
}
