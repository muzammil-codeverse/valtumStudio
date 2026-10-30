import { SignInForm } from "@/modules/auth/ui/sign-in-form";

export default function SignInPage(): React.JSX.Element {
  return (
    <section aria-labelledby="sign-in-title" className="auth-card">
      <p className="auth-eyebrow">Private administration</p>
      <h1 id="sign-in-title">Sign in to Valtum Studio</h1>
      <SignInForm />
    </section>
  );
}
