import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadHomePageData } from "@/modules/public-site/home/data/home-loader";
import { CaseStudy } from "@/modules/public-site/studio/CaseStudy";
import { getStory, withPublishedMedia } from "@/modules/public-site/studio/content";

type Properties = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Properties): Promise<Metadata> {
  const story = getStory((await params).slug);
  return story
    ? {
        title: `${story.title} | Valtum Studio`,
        alternates: { canonical: `/work/${story.slug}` },
        description: story.premise,
        openGraph: { images: [story.image] }
      }
    : { title: "Project not found | Valtum Studio" };
}
export default async function ProjectPage({
  params
}: Properties): Promise<React.JSX.Element> {
  const story = getStory((await params).slug);
  if (!story) notFound();
  const { projects } = await loadHomePageData();
  return <CaseStudy story={withPublishedMedia(story, projects)} />;
}
