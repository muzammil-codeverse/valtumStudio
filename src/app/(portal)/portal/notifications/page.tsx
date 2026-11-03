import { DeliveryInbox } from "@/modules/portal/ui/DeliveryInbox";

export const dynamic = "force-dynamic";

export default async function ClientNotifications({
  searchParams
}: {
  searchParams: Promise<{ cursor?: string }>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  return <DeliveryInbox cursor={params.cursor ?? null} path="/portal/notifications" />;
}
