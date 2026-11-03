import { notFound } from "next/navigation";

import { DeliveryHistoryPage } from "@/modules/portal/ui/DeliveryHistoryPage";

export const dynamic = "force-dynamic";

export default async function CustomerProjectHistory({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    view?: string;
    cursor?: string;
    q?: string;
    status?: string;
  }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  if (id.length < 8 || id.length > 128) notFound();
  return (
    <DeliveryHistoryPage
      projectId={id}
      base={"/portal/projects/" + id + "/history"}
      returnHref={"/portal/projects/" + id + "#workroom"}
      admin={false}
      params={await searchParams}
    />
  );
}
