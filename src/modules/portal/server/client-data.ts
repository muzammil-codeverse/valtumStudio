import "server-only";

import { prisma } from "@/lib/database";

export function isClientPortalEnabled(): boolean {
  return process.env["CLIENT_PORTAL_ENABLED"] === "true";
}

export async function getClientWorkspaceIds(userId: string): Promise<string[]> {
  const memberships = await prisma.clientMembership.findMany({
    where: { userId },
    select: { workspaceId: true }
  });
  return memberships.map((membership) => membership.workspaceId);
}

export async function getClientDashboard(userId: string) {
  const workspaceIds = await getClientWorkspaceIds(userId);
  if (workspaceIds.length === 0) {
    return {
      workspaces: [],
      engagements: [],
      milestones: [],
      invoices: [],
      updates: [],
      tasks: []
    };
  }
  const whereWorkspace = { workspaceId: { in: workspaceIds } };
  const [workspaces, engagements, milestones, invoices, updates, tasks] =
    await Promise.all([
      prisma.clientWorkspace.findMany({
        where: { id: { in: workspaceIds } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" }
      }),
      prisma.clientEngagement.findMany({
        where: whereWorkspace,
        select: {
          id: true,
          title: true,
          summary: true,
          status: true,
          startDate: true,
          targetDate: true,
          workspace: { select: { name: true } },
          _count: { select: { milestones: true, tasks: true } }
        },
        orderBy: { updatedAt: "desc" },
        take: 50
      }),
      prisma.clientMilestone.findMany({
        where: { engagement: whereWorkspace },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          engagement: { select: { id: true, title: true } }
        },
        orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
        take: 100
      }),
      prisma.clientInvoice.findMany({
        where: {
          engagement: whereWorkspace,
          status: { in: ["ISSUED", "PAID"] }
        },
        select: {
          id: true,
          reference: true,
          description: true,
          status: true,
          amountCents: true,
          currency: true,
          issuedAt: true,
          dueDate: true,
          paidAt: true,
          engagement: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      prisma.clientUpdate.findMany({
        where: {
          engagement: whereWorkspace,
          publishedAt: { not: null }
        },
        select: {
          id: true,
          title: true,
          body: true,
          publishedAt: true,
          engagement: { select: { id: true, title: true } }
        },
        orderBy: { publishedAt: "desc" },
        take: 25
      }),
      prisma.clientTask.findMany({
        where: { engagement: whereWorkspace },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          engagement: { select: { id: true, title: true } }
        },
        orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }],
        take: 100
      })
    ]);
  return { workspaces, engagements, milestones, invoices, updates, tasks };
}

export async function getClientEngagement(userId: string, id: string) {
  // Authorization is embedded in the object lookup. An opaque ID never grants access.
  return prisma.clientEngagement.findFirst({
    where: {
      id,
      workspace: { memberships: { some: { userId } } }
    },
    select: {
      id: true,
      title: true,
      summary: true,
      status: true,
      startDate: true,
      targetDate: true,
      workspace: { select: { name: true } },
      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          completedAt: true
        },
        orderBy: { sortOrder: "asc" }
      },
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true
        },
        orderBy: { sortOrder: "asc" }
      },
      invoices: {
        where: { status: { in: ["ISSUED", "PAID"] } },
        select: {
          id: true,
          reference: true,
          amountCents: true,
          currency: true,
          status: true,
          dueDate: true
        },
        orderBy: { createdAt: "desc" }
      },
      updates: {
        where: { publishedAt: { not: null } },
        select: { id: true, title: true, body: true, publishedAt: true },
        orderBy: { publishedAt: "desc" }
      }
    }
  });
}

export function formatClientMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency
  }).format(amountCents / 100);
}

export function clientReadableStatus(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}
