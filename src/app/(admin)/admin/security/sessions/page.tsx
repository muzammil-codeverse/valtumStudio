import type { Metadata } from "next";
import { headers } from "next/headers";

import { SurfaceCard } from "@/modules/admin/ui/components/cards";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageHeader
} from "@/modules/admin/ui/shell/PageComposition";
import { requirePermission } from "@/modules/auth/server/authorization";
import { SessionsPanel } from "@/modules/auth/ui/sessions-panel";

export const metadata: Metadata = {
  title: "Active Sessions | Valtum Studio Admin",
  description:
    "Manage active login sessions for the Valtum Studio administration workspace."
};

export default async function SessionsPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "sessions", "read");

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Active Sessions"
        description="Review and manage the active browser sessions for your administrative account. Revoked sessions are rejected at their next authenticated request."
      />
      <AdminPageBody>
        <SurfaceCard>
          <SessionsPanel />
        </SurfaceCard>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
