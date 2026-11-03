import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { serializeJsonLd } from "@/modules/public-content/domain/structured-data";
import { journalArticles } from "@/modules/public-site/studio/articles";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";
import {
  pageSeo,
  publicCanonical,
  publicPageMetadata,
  SEO_ORIGIN
} from "@/modules/public-site/studio/seo";

export const metadata: Metadata = publicPageMetadata(pageSeo.blog, "/blog");

export default function JournalPage(): React.JSX.Element {
  const canonical = publicCanonical("/blog");
  const journalSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical + "#journal",
    name: "Valtum Studio Journal",
    description: pageSeo.blog.description,
    url: canonical,
    isPartOf: { "@id": SEO_ORIGIN + "#website" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: journalArticles.length,
      itemListElement: journalArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "BlogPosting",
          headline: article.title,
          url: publicCanonical("/blog/" + article.slug),
          image: article.coverImage
        }
      }))
    }
  };

  return (
    <main className="b-journal" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(journalSchema) }}
      />
      <SeoBreadcrumb title="Journal" path="/blog" />
      <header className="b-journal-heading">
        <div>
          <h1>
            Ideas made
            <br />
            <em>practical.</em>
          </h1>
        </div>
        <p className="b-journal-intro">
          Notes on software, digital products and the details that shape a useful
          experience. Written from the questions we work through with founders and
          teams.
        </p>
        <Link className="b-journal-discover" href="#journal-list">
          Explore the journal <span aria-hidden="true">↘</span>
        </Link>
      </header>

      <section
        className="b-journal-list"
        id="journal-list"
        aria-label="Journal articles"
      >
        <div className="b-journal-list-heading">
          <h2>Recent thinking</h2>
          <span>{String(journalArticles.length).padStart(2, "0")} articles</span>
        </div>
        <div className="b-journal-grid">
          {journalArticles.map((article, index) => (
            <article className="b-journal-card" key={article.slug}>
              <Link
                className="b-journal-card-link"
                href={`/blog/${article.slug}`}
                aria-label={`Read ${article.title}`}
              >
                <figure className="b-journal-card-image">
                  <Image
                    src={article.coverImage}
                    alt={article.coverAlt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 760px) 92vw, (max-width: 1100px) 45vw, 40vw"
                  />
                </figure>
                <div className="b-journal-card-copy">
                  <div className="b-journal-card-meta">
                    <span className="b-journal-card-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{article.topic}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <span className="b-journal-read">
                    Read article <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="b-journal-interval" aria-labelledby="journal-interval-title">
        <figure className="b-journal-interval-media">
          <Image
            src="/editorial/paper.webp"
            alt="A close-up of paper and working materials"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </figure>
        <div className="b-journal-interval-copy">
          <h2 id="journal-interval-title">
            Better questions.
            <br />
            <em>Better decisions.</em>
          </h2>
          <p>
            Thoughtful digital work starts before the first screen. Explore the
            questions behind useful software, clearer workflows and more purposeful
            experiences.
          </p>
          <Link href="/approach">How we work <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className="b-journal-contact">
        <h2>Bring the real problem.</h2>
        <p>
          A useful conversation starts with the part that is difficult to explain. We
          can help you find the right next step.
        </p>
        <Link className="b-journal-contact-link" href="/contact">
          Start a conversation <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
