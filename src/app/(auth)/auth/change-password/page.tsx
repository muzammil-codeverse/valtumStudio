import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";
import { ChangePasswordForm } from "@/modules/auth/ui/change-password-form";

export default async function ChangePasswordPage(): Promise<React.JSX.Element> {
  const principal = await getOptionalSession(await headers());
  if (principal === null) redirect("/auth/sign-in");
  if (getAuthenticationAssurance(principal) === "FULLY_AUTHENTICATED")
    redirect("/admin");
  if (!principal.mustChangePassword) redirect("/auth/setup-two-factor");
  return (
    <section aria-labelledby="change-password-title" className="auth-card">
      <p className="auth-eyebrow">Required step</p>
      <h1 id="change-password-title">Choose a new password</h1>
      <ChangePasswordForm />
    </section>
  );
}
