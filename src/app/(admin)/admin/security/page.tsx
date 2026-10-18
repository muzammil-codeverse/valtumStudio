import type { Metadata } from "next";
import { headers } from "next/headers";

import { SecurityCard } from "@/modules/admin/ui/components/cards";
import { SecurityIcon, SessionsIcon } from "@/modules/admin/ui/components/icons";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageHeader,
  AdminPageSection
} from "@/modules/admin/ui/shell/PageComposition";
import { requirePermission } from "@/modules/auth/server/authorization";

export const metadata: Metadata = {
  title: "Security | Siglum Studio Admin",
  description: "Monitor Siglum Studio security operations."
};

export default async function SecurityPage(): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "securityEvents", "read");

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Security"
        description="Monitor authentication controls, active session state, and access configuration for the Siglum Studio administration workspace."
      />
      <AdminPageBody>
        <AdminPageSection>
          <h2 className="text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">
            Active Controls
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SecurityCard
              title="Active Sessions"
              description="Review all active login sessions, their originating device details, and revoke access to individual or all other browser sessions."
              statusText="Revocable authentication sessions"
              href="/admin/security/sessions"
              actionText="Manage Sessions"
              icon={<SessionsIcon size={20} />}
            />
            <SecurityCard
              title="Security Event Log"
              description="A structured timeline of authentication, authorization, and account state events across the administration workspace will be available here."
              statusText="Phase 5 integration scope"
              icon={<SecurityIcon size={20} />}
            />
          </div>
        </AdminPageSection>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
