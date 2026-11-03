import "server-only";

import { prisma } from "@/lib/database";

import { authorizeDeliveryProject, membershipFilter } from "./collaboration-access";

export async function getDeliveryCollaboration(engagementId: string) {
  const access = await authorizeDeliveryProject(engagementId);
  const where = {
    engagementId,
    ...(access.customer
      ? { engagement: membershipFilter(access.principal.userId) }
      : {})
  };
  const [decisions, messages, files, activity] = await Promise.all([
    prisma.clientDecision.findMany({
      where,
      include: {
        milestone: { select: { title: true, contentRevision: true } },
        respondedBy: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.clientMessage.findMany({
      where,
      include: {
        author: { select: { name: true } },
        task: { select: { title: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.clientFile.findMany({
      where: { ...where, status: "READY", scanCompletedAt: { not: null } },
      include: { uploader: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.clientDeliveryEvent.findMany({
      where: { ...where, ...(access.customer ? { visibleToClient: true } : {}) },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 40
    })
  ]);
  return { access, decisions, messages: messages.reverse(), files, activity };
}
