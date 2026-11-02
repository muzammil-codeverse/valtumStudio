import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  buildBreadcrumbListJsonLd,
  serializeJsonLd
} from "@/modules/public-content/domain/structured-data";
import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { CaseStudy } from "@/modules/public-site/studio/CaseStudy";
import { getStory, withPublishedMedia } from "@/modules/public-site/studio/content";
import {
  projectSeo,
  publicCanonical,
  publicPageMetadata,
  SEO_ORIGIN
} from "@/modules/public-site/studio/seo";

type Properties = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Properties): Promise<Metadata> {
  const story = getStory((await params).slug);
  if (!story)
    return { title: "Project not found", robots: { index: false, follow: false } };
  const copy = projectSeo[story.slug] ?? {
    title: story.title + " | Valtum Studio",
    description: story.intro
  };
  return publicPageMetadata(copy, "/work/" + story.slug);
}

export default async function ProjectPage({
  params
}: Properties): Promise<React.JSX.Element> {
  const story = getStory((await params).slug);
  if (!story) notFound();
  const { projects } = await loadHomePageData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": publicCanonical("/work/" + story.slug) + "#case-study",
            name: story.title,
            description: story.intro,
            url: publicCanonical("/work/" + story.slug),
            image: publicCanonical(story.image),
            creator: { "@id": SEO_ORIGIN + "#organization" }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbListJsonLd(SEO_ORIGIN, [
              { name: "Home", path: "/" },
              { name: "Work", path: "/work" },
              { name: story.title, path: "/work/" + story.slug }
            ])
          )
        }}
      />
      <CaseStudy story={withPublishedMedia(story, projects)} />
    </>
  );
}
