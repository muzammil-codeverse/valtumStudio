import "server-only";

import { prisma } from "@/lib/database";

/** Month-scoped records; never derive a calendar from the capped overview lists. */
export async function getClientCalendarData(userId: string, month: string) {
  if (!/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid schedule month.");
  }
  const first = new Date(month + "-01T00:00:00.000Z");
  const start = new Date(first.getTime() - 8 * 86400000);
  const end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 9));
  const workspace = {
    workspace: { memberships: { some: { userId } } }
  };
  const whereEngagement = workspace;
  const whereRelated = { engagement: workspace };
  const [milestones, tasks, decisions, engagements] = await Promise.all([
    prisma.clientMilestone.findMany({
      where: { ...whereRelated, dueDate: { gte: start, lt: end } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        engagement: { select: { id: true, title: true } }
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }]
    }),
    prisma.clientTask.findMany({
      where: { ...whereRelated, dueDate: { gte: start, lt: end } },
      select: {
        id: true,
        title: true,
        dueDate: true,
        engagement: { select: { id: true, title: true } }
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }]
    }),
    prisma.clientDecision.findMany({
      where: {
        ...whereRelated,
        status: "REQUESTED",
        dueDate: { gte: start, lt: end }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        engagement: { select: { id: true, title: true } }
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }]
    }),
    prisma.clientEngagement.findMany({
      where: { ...whereEngagement, targetDate: { gte: start, lt: end } },
      select: {
        id: true,
        title: true,
        targetDate: true,
        workspace: { select: { name: true } }
      },
      orderBy: [{ targetDate: "asc" }, { id: "asc" }]
    })
  ]);
  return { milestones, tasks, decisions, engagements };
}
