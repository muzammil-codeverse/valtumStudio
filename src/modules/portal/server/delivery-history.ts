import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";

import { HISTORY_PAGE_SIZE, type HistoryView } from "../domain/history-query";
import { authorizeDeliveryProject, membershipFilter } from "./collaboration-access";

export type HistoryRecord = Readonly<{
  id: string;
  createdAt: Date;
  title: string;
  body: string | null;
  meta: string;
  fileId?: string;
  status?: string;
}>;

export type DeliveryHistory = Readonly<{
  customer: boolean;
  workspaceId: string;
  projectId: string;
  records: HistoryRecord[];
  nextCursor: string | null;
}>;

function toPage(
  records: HistoryRecord[],
  customer: boolean,
  projectId: string,
  workspaceId: string
): DeliveryHistory {
  const hasMore = records.length > HISTORY_PAGE_SIZE;
  const shown = records.slice(0, HISTORY_PAGE_SIZE);
  return {
    customer,
    workspaceId,
    projectId,
    records: shown,
    nextCursor: hasMore ? (shown[shown.length - 1]?.id ?? null) : null
  };
}

export async function getDeliveryHistory(
  projectId: string,
  query: {
    view: HistoryView;
    cursor: string | null;
    search: string;
    status: string | null;
  }
): Promise<DeliveryHistory> {
  const { principal, engagement, customer } = await authorizeDeliveryProject(projectId);
  const whereProject = {
    engagementId: projectId,
    ...(customer ? { engagement: membershipFilter(principal.userId) } : {})
  };
  const contains = query.search
    ? { contains: query.search, mode: "insensitive" as const }
    : undefined;
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  const pagination: { cursor?: { id: string }; skip?: number } = {};
  if (query.cursor) {
    pagination.cursor = { id: query.cursor };
    pagination.skip = 1;
  }
  const limit = HISTORY_PAGE_SIZE + 1;

  if (query.view === "messages") {
    const where = {
      ...whereProject,
      ...(contains ? { body: contains } : {})
    };
    if (
      query.cursor &&
      !(await prisma.clientMessage.findFirst({
        where: { ...where, id: query.cursor },
        select: { id: true }
      }))
    )
      notFound();
    const rows = await prisma.clientMessage.findMany({
      where,
      include: {
        author: { select: { name: true } },
        task: { select: { title: true } }
      },
      orderBy,
      ...pagination,
      take: limit
    });
    return toPage(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        title: row.author.name,
        body: row.body,
        meta: row.task ? "Regarding task: " + row.task.title : "Project conversation"
      })),
      customer,
      projectId,
      engagement.workspaceId
    );
  }

  if (query.view === "decisions") {
    const where = {
      ...whereProject,
      ...(query.status
        ? {
            status: query.status as
              "REQUESTED" | "APPROVED" | "CHANGES_REQUESTED" | "CANCELLED"
          }
        : {}),
      ...(contains ? { OR: [{ title: contains }, { description: contains }] } : {})
    };
    if (
      query.cursor &&
      !(await prisma.clientDecision.findFirst({
        where: { ...where, id: query.cursor },
        select: { id: true }
      }))
    )
      notFound();
    const rows = await prisma.clientDecision.findMany({
      where,
      include: {
        milestone: { select: { title: true } },
        respondedBy: { select: { name: true } }
      },
      orderBy,
      ...pagination,
      take: limit
    });
    return toPage(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        title: row.title,
        body: [
          row.description,
          row.responseNote ? "Customer feedback: " + row.responseNote : null
        ]
          .filter(Boolean)
          .join("\n\n"),
        meta: [
          row.status.toLowerCase().replaceAll("_", " "),
          row.milestone?.title,
          row.respondedBy?.name
        ]
          .filter(Boolean)
          .join(" · "),
        status: row.status
      })),
      customer,
      projectId,
      engagement.workspaceId
    );
  }

  if (query.view === "files") {
    const where = {
      ...whereProject,
      status: "READY" as const,
      scanCompletedAt: { not: null },
      ...(contains ? { filename: contains } : {})
    };
    if (
      query.cursor &&
      !(await prisma.clientFile.findFirst({
        where: { ...where, id: query.cursor },
        select: { id: true }
      }))
    )
      notFound();
    const rows = await prisma.clientFile.findMany({
      where,
      include: { uploader: { select: { name: true } } },
      orderBy,
      ...pagination,
      take: limit
    });
    return toPage(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        title: row.filename,
        body: null,
        meta:
          "Shared by " +
          row.uploader.name +
          " · " +
          (row.byteSize / (1024 * 1024)).toFixed(2) +
          " MB",
        fileId: row.id
      })),
      customer,
      projectId,
      engagement.workspaceId
    );
  }

  const where = {
    ...whereProject,
    ...(customer ? { visibleToClient: true } : {}),
    ...(contains ? { summary: contains } : {})
  };
  if (
    query.cursor &&
    !(await prisma.clientDeliveryEvent.findFirst({
      where: { ...where, id: query.cursor },
      select: { id: true }
    }))
  )
    notFound();
  const rows = await prisma.clientDeliveryEvent.findMany({
    where,
    include: { actor: { select: { name: true } } },
    orderBy,
    ...pagination,
    take: limit
  });
  return toPage(
    rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      title: row.summary,
      body: null,
      meta:
        row.kind.toLowerCase().replaceAll("_", " ") +
        " · " +
        (row.actor?.name ?? "Former member")
    })),
    customer,
    projectId,
    engagement.workspaceId
  );
}
