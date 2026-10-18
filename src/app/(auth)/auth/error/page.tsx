import Link from "next/link";

export default function AuthenticationErrorPage(): React.JSX.Element {
  return (
    <section className="auth-card">
      <h1>Authentication unavailable</h1>
      <p>The request could not be completed. Try again or contact an operator.</p>
      <Link href="/auth/sign-in">Return to sign in</Link>
    </section>
  );
}
