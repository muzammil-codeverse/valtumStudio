import type { Metadata } from "next";
import Link from "next/link";

import { Archive } from "@/modules/public-site/studio/Archive";
import { stories } from "@/modules/public-site/studio/content";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
export const metadata: Metadata = publicPageMetadata(pageSeo.work, "/work");
export const dynamic = "force-dynamic";
export default function WorkPage(): React.JSX.Element {
  return (
    <main className="x-work-page" id="main-content">
      <header className="x-editorial-heading">
        <h1>
          The work,
          <br />
          <em>in context.</em>
        </h1>
        <p>
          A reservation, a delivery, an observation. Each project begins with a
          different question and follows it through the experience and the system.
        </p>
      </header>
      <nav className="x-project-directory" aria-label="Go directly to a case study">
        {stories.map((story) => (
          <Link href={`/work/${story.slug}`} key={story.slug}>
            {story.title}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
      <Archive full projects={stories} />
      <section className="x-work-connections">
        <h2 data-word-reveal>
          Different products.
          <br />
          Connected thinking.
        </h2>
        <div>
          <p>
            A booking and a delivery both make promises that an operation has to keep.
            An observation and an assessment both need a source that can be examined.
          </p>
          <p>
            Across the work, the same questions return. Who needs to act? What do they
            need to know? What should happen when the ordinary path breaks?
          </p>
          <Link className="x-link" href="/services">
            Explore the studio’s services ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
