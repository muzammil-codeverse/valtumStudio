import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  buildBreadcrumbListJsonLd,
  serializeJsonLd
} from "@/modules/public-content/domain/structured-data";
import {
  getJournalArticle,
  journalArticles
} from "@/modules/public-site/studio/articles";
import {
  publicCanonical,
  publicPageMetadata,
  SEO_ORIGIN
} from "@/modules/public-site/studio/seo";

type Properties = { params: Promise<{ slug: string }> };

const editorialCompanions: Record<
  string,
  { image: string; alt: string; caption: string; observation: string }
> = {
  "before-you-commission-custom-software": {
    image: "/editorial/sketch.webp",
    alt: "Sketches and working materials considered in detail",
    caption: "Understand the handoffs before designing the screens.",
    observation:
      "Follow one real request, including the exceptions, before choosing a platform."
  },
  "motion-that-helps-a-website": {
    image: "/editorial/light.webp",
    alt: "Light and shadow across an architectural interior",
    caption: "Movement works best when it brings a composition into focus.",
    observation:
      "Give every transition a purpose, and always provide a complete still experience."
  },
  "automate-the-handoff-not-the-mess": {
    image: "/editorial/detail.webp",
    alt: "A close study of an interface and collaborative work",
    caption: "Reliable systems make their decisions and failure paths visible.",
    observation:
      "Give each shared record an owner and every failed handoff a recovery path."
  }
};

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return journalArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Properties): Promise<Metadata> {
  const article = getJournalArticle((await params).slug);
  if (!article) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }

  const path = "/blog/" + article.slug;
  const canonical = publicCanonical(path);
  const base = publicPageMetadata(
    {
      title: article.title + " | Valtum Studio Journal",
      description: article.description
    },
    path
  );

  return {
    ...base,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: canonical,
      siteName: "Valtum Studio",
      locale: "en_AU",
      images: [
        {
          url: article.coverImage,
          width: 2400,
          height: 1600,
          alt: article.coverAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [article.coverImage]
    }
  };
}

export default async function JournalArticlePage({
  params
}: Properties): Promise<React.JSX.Element> {
  const article = getJournalArticle((await params).slug);
  if (!article) notFound();

  const titleWords = article.title.split(" ");
  const titleBreak = Math.ceil(titleWords.length / 2);
  const editorialCompanion = editorialCompanions[article.slug];
  const relatedArticles = journalArticles.filter(
    (candidate) => candidate.slug !== article.slug
  );

  const path = "/blog/" + article.slug;
  const canonical = publicCanonical(path);
  const organizationId = SEO_ORIGIN + "#organization";
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": canonical + "#article",
    headline: article.title,
    description: article.description,
    image: [article.coverImage],
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    isPartOf: { "@id": SEO_ORIGIN + "#website" },
    articleSection: article.topic,
    inLanguage: "en-AU",
    author: { "@type": "Organization", "@id": organizationId },
    publisher: { "@type": "Organization", "@id": organizationId }
  };

  return (
    <main className="b-article" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbListJsonLd(SEO_ORIGIN, [
              { name: "Home", path: "/" },
              { name: "Journal", path: "/blog" },
              { name: article.title, path }
            ])
          )
        }}
      />

      <header className="b-article-heading">
        <Link className="b-back-link" href="/blog">
          ← All journal articles
        </Link>
        <div className="b-article-title-row">
          <div>
            <h1>
              {titleWords.slice(0, titleBreak).join(" ")}{" "}
              <em>{titleWords.slice(titleBreak).join(" ")}</em>
            </h1>
          </div>
          <p className="b-article-description">{article.description}</p>
        </div>
        <div className="b-article-meta">
          <span>{article.topic}</span>
          <span aria-hidden="true">·</span>
          <span>Valtum Studio</span>
          <span aria-hidden="true">·</span>
          <span>{article.readTime}</span>
        </div>
      </header>

      <figure className="b-article-cover">
        <Image
          src={article.coverImage}
          alt={article.coverAlt}
          fill
          priority
          sizes="(max-width: 760px) 92vw, 88vw"
        />
      </figure>

      <div className="b-article-layout">
        <nav className="b-article-toc" aria-label="In this article">
          <p>In this article</p>
          <ol>
            {article.sections.map((section, index) => (
              <li key={section.heading}>
                <a href={`#section-${index + 1}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="b-article-body">
          {article.sections.map((section, index) => (
            <section
              className="b-article-section"
              id={`section-${index + 1}`}
              key={section.heading}
            >
              <h2>
                <span className="b-article-chapter-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {index === 1 && editorialCompanion && (
                <figure className="b-article-inline-media">
                  <div>
                    <Image
                      src={editorialCompanion.image}
                      alt={editorialCompanion.alt}
                      fill
                      sizes="(max-width: 760px) 86vw, 680px"
                    />
                  </div>
                  <figcaption>{editorialCompanion.caption}</figcaption>
                </figure>
              )}
              {index === 2 && editorialCompanion && (
                <aside className="b-article-observation">
                  <p>{editorialCompanion.observation}</p>
                </aside>
              )}
            </section>
          ))}

          <section className="b-article-sources" aria-labelledby="b-sources-title">
            <h2 id="b-sources-title">Sources and further reading</h2>
            <ul>
              {article.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="b-article-next">
            <h2>{article.serviceLabel}</h2>
            <Link href={`/services/${article.serviceSlug}`}>
              Explore the service <span aria-hidden="true">↗</span>
            </Link>
          </section>
          <Link className="b-back-link b-back-link--bottom" href="/blog">
            ← Back to the journal
          </Link>
        </article>
      </div>

      <section className="b-article-related" aria-labelledby="related-reading-title">
        <div className="b-article-related-heading">
          <h2 id="related-reading-title">Continue exploring.</h2>
          <Link href="/blog">All journal articles ↗</Link>
        </div>
        <div className="b-article-related-grid">
          {relatedArticles.map((related) => (
            <Link
              className="b-article-related-card"
              href={`/blog/${related.slug}`}
              key={related.slug}
            >
              <figure>
                <Image
                  src={related.coverImage}
                  alt={related.coverAlt}
                  fill
                  sizes="(max-width: 760px) 90vw, 45vw"
                />
              </figure>
              <span>{related.topic}</span>
              <h3>
                {related.title} <span aria-hidden="true">↗</span>
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
