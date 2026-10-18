import "server-only";

import { prisma } from "@/lib/database";
import type { Role } from "@/modules/auth/domain/roles";
import { can } from "@/modules/auth/policies/authorization";

export type ContentMetric = {
  total: number;
  draft: number;
  published: number;
};

export type AdminDashboardSummary = {
  services?: ContentMetric;
  projects?: ContentMetric;
  mediaCount?: number;
  leads?: {
    total: number;
    newCount: number;
  };
  usersCount?: number;
};

export async function fetchDashboardSummary(
  role: Role
): Promise<AdminDashboardSummary> {
  const canReadServices = can(role, { resource: "services", action: "read" });
  const canReadProjects = can(role, { resource: "projects", action: "read" });
  const canReadMedia = can(role, { resource: "media", action: "read" });
  const canReadLeads = can(role, { resource: "leads", action: "read" });
  const canReadUsers = can(role, { resource: "users", action: "read" });

  // Execute database aggregate queries in parallel
  const [servicesData, projectsData, mediaData, leadsData, usersData] =
    await Promise.all([
      canReadServices
        ? prisma.serviceOffering.groupBy({
            by: ["status"],
            _count: { _all: true }
          })
        : Promise.resolve(null),
      canReadProjects
        ? prisma.project.groupBy({
            by: ["status"],
            _count: { _all: true }
          })
        : Promise.resolve(null),
      canReadMedia ? prisma.mediaAsset.count() : Promise.resolve(null),
      canReadLeads
        ? Promise.all([
            prisma.lead.count(),
            prisma.lead.count({ where: { status: "NEW" } })
          ])
        : Promise.resolve(null),
      canReadUsers
        ? prisma.user.count({ where: { NOT: { banned: true } } })
        : Promise.resolve(null)
    ]);

  // Construct results immutably
  const services: ContentMetric | undefined = servicesData
    ? {
        total: servicesData.reduce((acc, curr) => acc + curr._count._all, 0),
        draft: servicesData.find((item) => item.status === "DRAFT")?._count._all ?? 0,
        published:
          servicesData.find((item) => item.status === "PUBLISHED")?._count._all ?? 0
      }
    : undefined;

  const projects: ContentMetric | undefined = projectsData
    ? {
        total: projectsData.reduce((acc, curr) => acc + curr._count._all, 0),
        draft: projectsData.find((item) => item.status === "DRAFT")?._count._all ?? 0,
        published:
          projectsData.find((item) => item.status === "PUBLISHED")?._count._all ?? 0
      }
    : undefined;

  const leads = leadsData ? { total: leadsData[0], newCount: leadsData[1] } : undefined;

  return {
    ...(services !== undefined && { services }),
    ...(projects !== undefined && { projects }),
    ...(mediaData !== null && { mediaCount: mediaData }),
    ...(leads !== undefined && { leads }),
    ...(usersData !== null && { usersCount: usersData })
  };
}
