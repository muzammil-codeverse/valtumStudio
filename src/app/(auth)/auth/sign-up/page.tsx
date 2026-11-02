import Link from "next/link";

import { CustomerSignUpForm } from "@/modules/auth/ui/customer-sign-up-form";

export default function CustomerSignUpPage(): React.JSX.Element {
  const registrationEnabled =
    process.env["CLIENT_PORTAL_ENABLED"] === "true" &&
    process.env["CUSTOMER_SIGNUP_ENABLED"] === "true" &&
    Boolean(process.env["RESEND_API_KEY"] && process.env["LEAD_EMAIL_FROM"]);
  return (
    <section aria-labelledby="sign-up-title" className="auth-card">
      <h1 id="sign-up-title">Create your account.</h1>
      <p className="auth-intro">
        A considered space for your projects, decisions and deadlines.
      </p>
      {registrationEnabled ? (
        <CustomerSignUpForm />
      ) : (
        <div className="auth-result">
          <h2>Registration opens with your workspace.</h2>
          <p>
            Customer access is being prepared. Contact the studio to arrange your
            project space, or sign in if you already have an account.
          </p>
          <a className="auth-action-link" href="mailto:hello@valtumstudio.com.au">
            Contact the studio
          </a>
        </div>
      )}
      <p className="auth-switch">
        Already have an account? <Link href="/auth/sign-in">Sign in</Link>
      </p>
    </section>
  );
}
