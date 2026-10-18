import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

import { leadPriorities, leadSources, leadStatuses } from "../domain/submission";

const PAGE_SIZE = 20;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.at(0) : value;
}

function isOneOf<T extends readonly string[]>(
  values: T,
  candidate: string | undefined
): candidate is T[number] {
  return candidate !== undefined && values.includes(candidate);
}

export type LeadListFilters = Readonly<{
  archived: "active" | "all" | "archived";
  assigneeUserId?: string;
  page: number;
  priority?: (typeof leadPriorities)[number];
  search?: string;
  source?: (typeof leadSources)[number];
  status?: (typeof leadStatuses)[number];
}>;

export function parseLeadListFilters(
  searchParams: Record<string, string | string[] | undefined>
): LeadListFilters {
  const requestedPage = Number(first(searchParams["page"]));
  const rawSearch = first(searchParams["q"]);
  const requestedPriority = first(searchParams["priority"]);
  const requestedSource = first(searchParams["source"]);
  const requestedStatus = first(searchParams["status"]);
  const search = rawSearch === undefined ? undefined : rawSearch.trim().slice(0, 120);
  const archivedValue = first(searchParams["archived"]);
  const archived =
    archivedValue === "archived" || archivedValue === "all" ? archivedValue : "active";
  const assigneeUserId = first(searchParams["assignee"]);
  return {
    archived,
    ...(assigneeUserId === undefined || assigneeUserId.length > 128
      ? {}
      : { assigneeUserId }),
    page:
      Number.isInteger(requestedPage) && requestedPage > 0
        ? Math.min(requestedPage, 10_000)
        : 1,
    ...(isOneOf(leadPriorities, requestedPriority)
      ? { priority: requestedPriority }
      : {}),
    ...(search === undefined || search === "" ? {} : { search }),
    ...(isOneOf(leadSources, requestedSource) ? { source: requestedSource } : {}),
    ...(isOneOf(leadStatuses, requestedStatus) ? { status: requestedStatus } : {})
  };
}

function leadWhere(filters: LeadListFilters): Prisma.LeadWhereInput {
  const conditions: Prisma.LeadWhereInput[] = [];
  if (filters.archived === "active") conditions.push({ archivedAt: null });
  if (filters.archived === "archived") conditions.push({ archivedAt: { not: null } });
  if (filters.status !== undefined) conditions.push({ status: filters.status });
  if (filters.priority !== undefined) conditions.push({ priority: filters.priority });
  if (filters.source !== undefined) conditions.push({ source: filters.source });
  if (filters.assigneeUserId !== undefined)
    conditions.push({ assigneeUserId: filters.assigneeUserId });
  if (filters.search !== undefined) {
    conditions.push({
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
        { projectSummary: { contains: filters.search, mode: "insensitive" } }
      ]
    });
  }
  return conditions.length === 0 ? {} : { AND: conditions };
}

export async function listLeads(filters: LeadListFilters) {
  const where = leadWhere(filters);
  const [items, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        company: true,
        projectType: true,
        status: true,
        priority: true,
        source: true,
        createdAt: true,
        assignee: { select: { name: true } }
      }
    }),
    prisma.lead.count({ where })
  ]);
  return { items, pageSize: PAGE_SIZE, total };
}

export async function getLeadDetail(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      serviceInterests: { orderBy: { interest: "asc" } },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } }
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } }
      }
    }
  });
}

export async function listEligibleLeadAssignees() {
  return prisma.user.findMany({
    where: {
      role: { in: ["owner", "admin"] },
      OR: [{ banned: false }, { banned: null }, { banExpires: { lte: new Date() } }]
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });
}
