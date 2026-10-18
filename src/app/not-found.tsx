import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link href="/">Return to the foundation page</Link>
    </main>
  );
}
