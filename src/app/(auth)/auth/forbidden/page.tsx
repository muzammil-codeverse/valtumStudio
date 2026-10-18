import Link from "next/link";

export default function ForbiddenPage(): React.JSX.Element {
  return (
    <section className="auth-card">
      <h1>Access denied</h1>
      <p>You do not have permission to perform that action.</p>
      <Link href="/admin">Return to administration</Link>
    </section>
  );
}
