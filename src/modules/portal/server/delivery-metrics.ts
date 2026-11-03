import "server-only";

import { prisma } from "@/lib/database";

export async function getClientDeliveryMetrics(userId: string, today = new Date()) {
  const whereTask = {
    engagement: { workspace: { memberships: { some: { userId } } } }
  };
  const whereEngagement = {
    workspace: { memberships: { some: { userId } } }
  };
  const todayStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const nextThirty = new Date(todayStart.getTime() + 30 * 86400000);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1)
  );
  const monthEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
  );
  const [
    taskStates,
    milestoneStates,
    engagementStates,
    invoiceStates,
    projectStates,
    taskProjectGroups,
    milestoneProjectGroups,
    taskDates,
    milestoneDates,
    upcomingTasks,
    upcomingMilestones
  ] = await Promise.all([
    prisma.clientTask.groupBy({
      by: ["status"],
      where: whereTask,
      _count: { _all: true }
    }),
    prisma.clientMilestone.groupBy({
      by: ["status"],
      where: whereTask,
      _count: { _all: true }
    }),
    prisma.clientEngagement.groupBy({
      by: ["status"],
      where: whereEngagement,
      _count: { _all: true }
    }),
    prisma.clientInvoice.groupBy({
      by: ["status"],
      where: {
        ...whereTask,
        status: { in: ["ISSUED", "PAID"] }
      },
      _count: { _all: true }
    }),
    prisma.clientEngagement.findMany({
      where: whereEngagement,
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 50
    }),
    prisma.clientTask.groupBy({
      by: ["engagementId", "status"],
      where: whereTask,
      _count: { _all: true }
    }),
    prisma.clientMilestone.groupBy({
      by: ["engagementId", "status"],
      where: whereTask,
      _count: { _all: true }
    }),
    prisma.clientTask.groupBy({
      by: ["dueDate"],
      where: { ...whereTask, dueDate: { gte: monthStart, lt: monthEnd } },
      _count: { _all: true }
    }),
    prisma.clientMilestone.groupBy({
      by: ["dueDate"],
      where: { ...whereTask, dueDate: { gte: monthStart, lt: monthEnd } },
      _count: { _all: true }
    }),
    prisma.clientTask.findMany({
      where: {
        ...whereTask,
        status: { not: "DONE" },
        dueDate: { gte: todayStart, lt: nextThirty }
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        engagement: { select: { id: true, title: true } }
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 8
    }),
    prisma.clientMilestone.findMany({
      where: {
        ...whereTask,
        status: { notIn: ["COMPLETE", "APPROVED"] },
        dueDate: { gte: todayStart, lt: nextThirty }
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        engagement: { select: { id: true, title: true } }
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 8
    })
  ]);
  const statusTotal = <T extends { _count: { _all: number } }>(groups: T[]) =>
    groups.reduce((total, group) => total + group._count._all, 0);
  const countStatus = <
    T extends {
      status: string;
      _count: { _all: number };
    }
  >(
    groups: T[],
    status: string
  ) => groups.find((item) => item.status === status)?._count._all ?? 0;

  const taskTotal = statusTotal(taskStates);
  const milestoneTotal = statusTotal(milestoneStates);
  const tasksDone = countStatus(taskStates, "DONE");
  const milestonesDone =
    countStatus(milestoneStates, "APPROVED") + countStatus(milestoneStates, "COMPLETE");
  const blocked = countStatus(taskStates, "BLOCKED");
  const active =
    countStatus(engagementStates, "ACTIVE") + countStatus(engagementStates, "REVIEW");
  const projectInProgress = active + countStatus(engagementStates, "PLANNING");
  const projectTotal = statusTotal(engagementStates);
  const issuedInvoiceCount = countStatus(invoiceStates, "ISSUED");
  const taskPercent = taskTotal ? Math.round((tasksDone / taskTotal) * 100) : null;
  const milestonePercent = milestoneTotal
    ? Math.round((milestonesDone / milestoneTotal) * 100)
    : null;

  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + index, 1)
    );
    const key = start.toISOString().slice(0, 7);
    const countForMonth = (rows: typeof taskDates) =>
      rows.reduce(
        (total, row) =>
          total + (row.dueDate?.toISOString().startsWith(key) ? row._count._all : 0),
        0
      );
    return {
      key,
      label: new Intl.DateTimeFormat("en-AU", {
        month: "short",
        timeZone: "UTC"
      }).format(start),
      count: countForMonth(taskDates) + countForMonth(milestoneDates)
    };
  });
  const monthMax = Math.max(1, ...months.map((row) => row.count));

  const perProject = new Map<string, { total: number; done: number }>();
  for (const group of taskProjectGroups) {
    const prev = perProject.get(group.engagementId) ?? { total: 0, done: 0 };
    prev.total += group._count._all;
    if (group.status === "DONE") prev.done += group._count._all;
    perProject.set(group.engagementId, prev);
  }
  const perMilestone = new Map<string, { total: number; done: number }>();
  for (const group of milestoneProjectGroups) {
    const prev = perMilestone.get(group.engagementId) ?? { total: 0, done: 0 };
    prev.total += group._count._all;
    if (group.status === "APPROVED" || group.status === "COMPLETE") {
      prev.done += group._count._all;
    }
    perMilestone.set(group.engagementId, prev);
  }
  const projects = projectStates.map((project) => {
    const count = perProject.get(project.id) ?? { total: 0, done: 0 };
    const milestones = perMilestone.get(project.id) ?? { total: 0, done: 0 };
    return {
      ...project,
      taskCount: count.total,
      tasksDone: count.done,
      milestoneCount: milestones.total,
      milestonesDone: milestones.done,
      percent: count.total ? Math.round((count.done / count.total) * 100) : null
    };
  });
  const upcoming = [
    ...upcomingTasks.map((item) => ({ ...item, kind: "Task" as const })),
    ...upcomingMilestones.map((item) => ({ ...item, kind: "Milestone" as const }))
  ]
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 8);

  return {
    taskTotal,
    milestoneTotal,
    tasksDone,
    milestonesDone,
    blocked,
    active,
    projectInProgress,
    projectTotal,
    taskPercent,
    milestonePercent,
    issuedInvoiceCount,
    upcoming,
    upcomingMilestones: upcomingMilestones.map((item) => ({
      ...item,
      kind: "Milestone" as const
    })),
    months,
    monthMax,
    projects
  };
}
