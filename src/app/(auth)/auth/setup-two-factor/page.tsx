import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getOptionalSession } from "@/modules/auth/server/authorization";
import { SetupTwoFactor } from "@/modules/auth/ui/setup-two-factor";

export default async function SetupTwoFactorPage(): Promise<React.JSX.Element> {
  const principal = await getOptionalSession(await headers());
  if (principal === null) redirect("/auth/sign-in");
  if (principal.mustChangePassword) redirect("/auth/change-password");
  if (principal.twoFactorEnabled && principal.recoveryCodesAcknowledged)
    redirect("/admin");
  return (
    <section aria-labelledby="setup-two-factor-title" className="auth-card">
      <p className="auth-eyebrow">Required step</p>
      <h1 id="setup-two-factor-title">Set up two-factor authentication</h1>
      <SetupTwoFactor />
    </section>
  );
}
