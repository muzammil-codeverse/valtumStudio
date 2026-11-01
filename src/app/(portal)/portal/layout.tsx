import "@/modules/portal/ui/portal.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { prisma } from "@/lib/database";
import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";
import { PortalShell } from "@/modules/portal/ui/PortalShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Client Space | Valtum Studio",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true }
};

export default async function PortalLayout({
  children
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  if (!isClientPortalEnabled()) notFound();
  const principal = await getOptionalSession(await headers());
  if (!principal) redirect("/auth/sign-in");
  const assurance = getAuthenticationAssurance(principal);
  if (assurance === "PASSWORD_CHANGE_REQUIRED") redirect("/auth/change-password");
  if (assurance === "TWO_FACTOR_SETUP_REQUIRED") redirect("/auth/setup-two-factor");
  if (assurance !== "FULLY_AUTHENTICATED") redirect("/auth/sign-in");
  if (principal.role !== "client") redirect("/admin");
  const memberships = await prisma.clientMembership.findMany({
    where: { userId: principal.userId },
    select: { workspace: { select: { id: true, name: true } } },
    take: 30
  });
  return (
    <PortalShell
      name={principal.name}
      workspaces={memberships.map((member) => member.workspace)}
    >
      {children}
    </PortalShell>
  );
}
