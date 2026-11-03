"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { inboxPrincipal, markDeliveryInboxRead } from "./delivery-inbox";

export async function markAllDeliveryNotificationsReadAction(): Promise<void> {
  const { principal, customer } = await inboxPrincipal();
  await markDeliveryInboxRead(principal.userId, customer);
  const path = customer ? "/portal/notifications" : "/admin/notifications";
  revalidatePath(path);
  redirect(path);
}
