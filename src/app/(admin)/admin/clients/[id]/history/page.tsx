import { notFound } from "next/navigation";

import { authorizeDeliveryProject } from "@/modules/portal/server/collaboration-access";
import { DeliveryHistoryPage } from "@/modules/portal/ui/DeliveryHistoryPage";

export const dynamic = "force-dynamic";

export default async function AdminProjectHistory({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    project?: string;
    view?: string;
    cursor?: string;
    q?: string;
    status?: string;
  }>;
}): Promise<React.JSX.Element> {
  const { id: workspaceId } = await params;
  const query = await searchParams;
  const projectId = query.project ?? "";
  if (
    workspaceId.length < 8 ||
    workspaceId.length > 128 ||
    projectId.length < 8 ||
    projectId.length > 128
  )
    notFound();
  const authorized = await authorizeDeliveryProject(projectId, "read");
  if (authorized.customer || authorized.engagement.workspaceId !== workspaceId)
    notFound();
  return (
    <div className="ds-workspace">
      <DeliveryHistoryPage
        projectId={projectId}
        base={"/admin/clients/" + workspaceId + "/history"}
        returnHref={
          "/admin/clients/" + workspaceId + "?project=" + projectId + "#workroom"
        }
        admin
        params={query}
      />
    </div>
  );
}
