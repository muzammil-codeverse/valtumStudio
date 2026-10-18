import { TwoFactorForm } from "@/modules/auth/ui/two-factor-form";

export default function TwoFactorPage(): React.JSX.Element {
  return (
    <section aria-labelledby="two-factor-title" className="auth-card">
      <p className="auth-eyebrow">Second factor</p>
      <h1 id="two-factor-title">Verify your authenticator</h1>
      <TwoFactorForm />
    </section>
  );
}
