import "server-only";

import { prisma } from "@/lib/database";
import {
  friendlyProjectType,
  type LeadDemandItem
} from "@/modules/admin/domain/lead-demand";
import type { Role } from "@/modules/auth/domain/roles";
import { can } from "@/modules/auth/policies/authorization";

export async function fetchLeadDemand(role: Role): Promise<LeadDemandItem[]> {
  if (!can(role, { resource: "leads", action: "read" })) return [];
  const groups = await prisma.lead.groupBy({
    by: ["projectType"],
    where: { archivedAt: null },
    _count: { _all: true }
  });
  return groups
    .map((group) => ({
      key: group.projectType,
      label: friendlyProjectType(group.projectType),
      count: group._count._all
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
