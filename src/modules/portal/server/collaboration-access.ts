import "server-only";

import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { can } from "@/modules/auth/policies/authorization";
import {
  type AuthPrincipal,
  requireCompletedAuthentication
} from "@/modules/auth/server/authorization";

import { recordId } from "../domain/collaboration";
import { isClientPortalEnabled } from "./client-data";

export function assertDeliveryEnabled(): void {
  if (!isClientPortalEnabled()) notFound();
}

export function membershipFilter(userId: string) {
  return { workspace: { memberships: { some: { userId } } } };
}

export async function authorizeDeliveryProject(
  rawEngagementId: string,
  access: "read" | "manage" = "read"
): Promise<{
  principal: AuthPrincipal;
  engagement: { id: string; workspaceId: string };
  customer: boolean;
}> {
  assertDeliveryEnabled();
  const engagementId = recordId.parse(rawEngagementId);
  const principal = await requireCompletedAuthentication(await headers());
  const customer = principal.role === "client";
  if (!customer && !can(principal.role, { resource: "clients", action: access })) {
    notFound();
  }
  const engagement = await prisma.clientEngagement.findFirst({
    where: {
      id: engagementId,
      ...(customer ? membershipFilter(principal.userId) : {})
    },
    select: { id: true, workspaceId: true }
  });
  if (!engagement) notFound();
  return { principal, engagement, customer };
}
