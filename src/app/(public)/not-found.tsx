import Link from "next/link";

export default function PublicNotFound(): React.JSX.Element {
  return (
    <main className="v-not-found" id="main-content">
      <h1>
        This page
        <br />
        has moved <em>out of view.</em>
      </h1>
      <p>You can return to the studio or find a story in the archive.</p>
      <Link className="v-text-link" href="/work">
        Explore the work ↗
      </Link>
    </main>
  );
}
