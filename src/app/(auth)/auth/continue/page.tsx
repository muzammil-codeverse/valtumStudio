import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { destinationForSession } from "@/modules/auth/domain/entry-destination";
import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";

export const dynamic = "force-dynamic";

export default async function ContinueAuthenticationPage(): Promise<never> {
  const principal = await getOptionalSession(await headers());
  const assurance = getAuthenticationAssurance(principal);
  redirect(destinationForSession(assurance, principal?.role));
}
