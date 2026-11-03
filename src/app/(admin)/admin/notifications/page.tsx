import { DeliveryInbox } from "@/modules/portal/ui/DeliveryInbox";

export const dynamic = "force-dynamic";

export default async function AdminNotifications({
  searchParams
}: {
  searchParams: Promise<{ cursor?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  return (
    <div className="ds-workspace">
      <DeliveryInbox cursor={params.cursor ?? null} path="/admin/notifications" />
    </div>
  );
}
