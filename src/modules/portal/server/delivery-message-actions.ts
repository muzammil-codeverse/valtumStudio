"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/database";

import { entryText, recordId } from "../domain/collaboration";
import { authorizeDeliveryProject, membershipFilter } from "./collaboration-access";
import { deliveryUrl, formValue, refreshDelivery } from "./delivery-action-helpers";

export async function postDeliveryMessageAction(form: FormData): Promise<void> {
  const engagementId = recordId.parse(formValue(form, "engagementId"));
  const { principal, engagement, customer } =
    await authorizeDeliveryProject(engagementId);
  const body = entryText(4000).parse(formValue(form, "body"));
  const rawTask = formValue(form, "taskId");
  const taskId = rawTask ? recordId.parse(rawTask) : null;
  if (
    taskId &&
    !(await prisma.clientTask.findFirst({
      where: { id: taskId, engagementId },
      select: { id: true }
    }))
  )
    throw new Error("Selected task does not belong to this project.");
  const since = new Date(Date.now() - 60 * 60 * 1000);
  if (
    (await prisma.clientMessage.count({
      where: { authorUserId: principal.userId, createdAt: { gte: since } }
    })) >= 40
  )
    throw new Error("Message limit reached. Please try later.");
  await prisma.$transaction(async (tx) => {
    if (
      customer &&
      !(await tx.clientEngagement.findFirst({
        where: { id: engagementId, ...membershipFilter(principal.userId) },
        select: { id: true }
      }))
    )
      throw new Error("Project membership is no longer active.");
    const message = await tx.clientMessage.create({
      data: { engagementId, authorUserId: principal.userId, taskId, body }
    });
    await tx.clientDeliveryEvent.create({
      data: {
        engagementId,
        actorUserId: principal.userId,
        kind: "MESSAGE_POSTED",
        entityId: message.id,
        summary: taskId ? "Task feedback posted" : "Project message posted"
      }
    });
  });
  refreshDelivery(engagement.workspaceId, engagementId);
  redirect(
    deliveryUrl(engagement.workspaceId, engagementId, customer) + "#conversation"
  );
}
