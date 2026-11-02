import "@/modules/admin/ui/shell/delivery.css";
import "@/modules/admin/ui/shell/workspace.css";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/modules/admin/ui/shell/AdminShell";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";
import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};

type AdministrationLayoutProperties = Readonly<{ children: ReactNode }>;

export default async function AdministrationLayout({
  children
}: AdministrationLayoutProperties): Promise<ReactNode> {
  const principal = await getOptionalSession(await headers());
  const assurance = getAuthenticationAssurance(principal);

  if (assurance === "ANONYMOUS" || principal === null) {
    redirect("/auth/sign-in");
  }
  if (assurance === "PASSWORD_CHANGE_REQUIRED") {
    redirect("/auth/change-password");
  }
  if (assurance === "TWO_FACTOR_SETUP_REQUIRED") {
    redirect("/auth/setup-two-factor");
  }

  if (principal.role === "client") {
    redirect("/portal");
  }

  const user = {
    name: principal.name,
    email: principal.email,
    role: principal.role
  };

  return (
    <AdminShell user={user} clientPortalEnabled={isClientPortalEnabled()}>
      {children}
    </AdminShell>
  );
}
