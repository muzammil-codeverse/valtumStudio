import "server-only";

import { revalidatePath } from "next/cache";

export function formValue(form: FormData, key: string): string {
  const item = form.get(key);
  return typeof item === "string" ? item : "";
}

export function parseDeliveryDate(raw: string): Date | null {
  if (!raw) return null;
  if (!/^20\d\d-\d\d-\d\d$/.test(raw)) throw new Error("Invalid date.");
  const date = new Date(raw + "T12:00:00.000Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw new Error("Invalid date.");
  }
  return date;
}

export function deliveryUrl(
  workspaceId: string,
  engagementId: string,
  customer: boolean
) {
  return customer
    ? "/portal/projects/" + engagementId
    : "/admin/clients/" + workspaceId + "?project=" + engagementId;
}

export function refreshDelivery(workspaceId: string, engagementId: string): void {
  revalidatePath("/portal/projects/" + engagementId);
  revalidatePath("/portal/updates");
  revalidatePath("/portal/calendar");
  revalidatePath("/portal");
  revalidatePath("/admin/clients/" + workspaceId);
}
