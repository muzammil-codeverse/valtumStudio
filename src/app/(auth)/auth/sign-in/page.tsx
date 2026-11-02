import Link from "next/link";

import { SignInForm } from "@/modules/auth/ui/sign-in-form";

export default function SignInPage(): React.JSX.Element {
  return (
    <section aria-labelledby="sign-in-title" className="auth-card">
      <h1 id="sign-in-title">Welcome back.</h1>
      <p className="auth-intro">
        Sign in to view the work, plans and conversations that matter.
      </p>
      <SignInForm />
      <p className="auth-switch">
        New customer? <Link href="/auth/sign-up">Create an account</Link>
      </p>
    </section>
  );
}
