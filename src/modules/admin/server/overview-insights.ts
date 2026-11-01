import "server-only";

import { prisma } from "@/lib/database";
import type { Role } from "@/modules/auth/domain/roles";
import { can } from "@/modules/auth/policies/authorization";

export type DashboardTrend = Readonly<{ key: string; label: string; count: number }>;
export type DashboardPipeline = Readonly<{ key: string; label: string; count: number }>;
export type DashboardRecentLead = Readonly<{
  id: string;
  name: string;
  projectType: string;
  status: string;
  createdAt: Date;
}>;
export type DashboardInsight = Readonly<{
  available: boolean;
  focusMonth: string;
  trend: DashboardTrend[];
  pipeline: DashboardPipeline[];
  recent: DashboardRecentLead[];
  dailyCounts: Readonly<Record<string, number>>;
  total: number;
  newCount: number;
  qualifiedCount: number;
  wonCount: number;
  currentMonthCount: number;
}>;

const statusLabels: Readonly<Record<string, string>> = {
  NEW: "New",
  IN_REVIEW: "In review",
  QUALIFIED: "Qualified",
  CONTACTED: "Contacted",
  DISCOVERY: "Discovery",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
  SPAM: "Spam",
  CLOSED: "Closed"
};

export function parseDashboardMonth(value: unknown, today = new Date()): string {
  const current = today.toISOString().slice(0, 7);
  if (typeof value !== "string" || !/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value)) {
    return current;
  }
  return value;
}

export function countLeadsByMonth(
  points: ReadonlyArray<Readonly<{ createdAt: Date; count: number }>>,
  focusMonth: string
): { trend: DashboardTrend[]; dailyCounts: Readonly<Record<string, number>> } {
  const [year, month] = focusMonth.split("-").map(Number);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (5 - index), 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en-AU", { month: "short", timeZone: "UTC" }).format(date),
      count: 0
    };
  });
  const byDay: Record<string, number> = {};
  for (const point of points) {
    const dateKey = point.createdAt.toISOString().slice(0, 10);
    const monthKey = dateKey.slice(0, 7);
    const bucket = months.find((item) => item.key === monthKey);
    if (bucket) bucket.count += point.count;
    if (monthKey === focusMonth) {
      byDay[dateKey] = (byDay[dateKey] ?? 0) + point.count;
    }
  }
  return { trend: months, dailyCounts: byDay };
}

export async function fetchDashboardInsight(
  role: Role,
  requestedMonth?: string
): Promise<DashboardInsight> {
  const focusMonth = parseDashboardMonth(requestedMonth);
  const empty: DashboardInsight = {
    available: false,
    focusMonth,
    trend: [],
    pipeline: [],
    recent: [],
    dailyCounts: {},
    total: 0,
    newCount: 0,
    qualifiedCount: 0,
    wonCount: 0,
    currentMonthCount: 0
  };
  if (!can(role, { resource: "leads", action: "read" })) return empty;

  const [year, month] = focusMonth.split("-").map(Number);
  const firstMonth = new Date(Date.UTC(year, month - 6, 1));
  const [days, statuses, recent] = await Promise.all([
    prisma.lead.groupBy({
      by: ["createdAt"],
      where: { archivedAt: null, createdAt: { gte: firstMonth } },
      _count: { _all: true }
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { archivedAt: null },
      _count: { _all: true }
    }),
    prisma.lead.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        projectType: true,
        status: true,
        createdAt: true
      }
    })
  ]);
  const { trend, dailyCounts } = countLeadsByMonth(
    days.map((point) => ({
      createdAt: point.createdAt,
      count: point._count._all
    })),
    focusMonth
  );
  const pipeline = statuses.map((status) => ({
    key: status.status,
    label: statusLabels[status.status] ?? status.status.toLowerCase(),
    count: status._count._all
  }));
  const count = (key: string) => pipeline.find((p) => p.key === key)?.count ?? 0;
  return {
    available: true,
    focusMonth,
    trend,
    pipeline,
    recent,
    dailyCounts,
    total: pipeline.reduce((sum, entry) => sum + entry.count, 0),
    newCount: count("NEW"),
    qualifiedCount: count("QUALIFIED"),
    wonCount: count("WON"),
    currentMonthCount: trend.at(-1)?.count ?? 0
  };
}
