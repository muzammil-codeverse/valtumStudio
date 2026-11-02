import type { Metadata } from "next";

import { getTrustedBaseUrl } from "@/modules/public-content/domain/routes";

import { stories } from "./content";
import { serviceStories } from "./services";

export const SEO_ORIGIN = "https://valtumstudio.com.au";
export const SEO_SOCIAL_IMAGE = SEO_ORIGIN + "/opengraph-image";

export type SeoCopy = Readonly<{ title: string; description: string }>;

export const pageSeo = {
  home: {
    title: "Valtum Studio | Custom Software & Digital Products",
    description:
      "Valtum Studio is an Australian software studio designing custom web applications, SaaS products, booking platforms, operational systems and distinctive digital experiences."
  },
  solutions: {
    title: "Software Solutions for Products & Operations | Valtum Studio",
    description:
      "Explore software solutions for new digital products, disconnected business workflows, intelligent decision tools and distinctive customer experiences."
  },
  services: {
    title: "Software, AI & Web Development Services | Valtum Studio",
    description:
      "Custom software engineering, digital product design, AI and analytics, business integrations and creative website development from an Australian studio."
  },
  work: {
    title: "Software Engineering & Digital Product Case Studies | Valtum Studio",
    description:
      "Explore Valtum Studio's software and design work across computer vision, booking systems, courier operations, simulations and digital experiences."
  },
  studio: {
    title: "About Valtum Studio | Independent Australian Software Studio",
    description:
      "Meet Valtum Studio, an independent Australian practice bringing product strategy, software engineering, interface design and creative technology together."
  },
  approach: {
    title: "Our Approach to Software Design & Delivery | Valtum Studio",
    description:
      "From discovery and product definition to design, engineering and handover, see how Valtum Studio approaches complex digital work with clear decisions."
  },
  contact: {
    title: "Start a Software Project | Contact Valtum Studio",
    description:
      "Tell Valtum Studio about a custom application, operational challenge, AI idea, booking platform or ambitious website. Start with a useful conversation."
  },
  privacy: {
    title: "Privacy & Enquiry Information | Valtum Studio",
    description:
      "Learn how Valtum Studio handles the information you share through its project enquiry form, including why the information is collected and how to contact us."
  }
} as const satisfies Record<string, SeoCopy>;

export const serviceSeo: Readonly<Record<string, SeoCopy>> = {
  "digital-products": {
    title: "Custom Web App & SaaS Development | Valtum Studio",
    description:
      "Design and engineering for web applications, SaaS platforms and customer portals. From product definition and UX to APIs, data and working software."
  },
  "websites-and-experiences": {
    title: "Creative Website Design & Development | Valtum Studio",
    description:
      "Distinctive websites built with thoughtful art direction, typography, accessible interactions and carefully engineered frontend experiences."
  },
  "intelligent-systems": {
    title: "AI, Analytics & Computer Vision Development | Valtum Studio",
    description:
      "Explore AI supported products, computer vision, analytical dashboards and decision tools designed around evidence, evaluation and human review."
  },
  "connected-operations": {
    title: "Workflow, Booking & Business Software | Valtum Studio",
    description:
      "Custom systems for bookings, marketplaces, logistics, dispatch, approvals and business integrations. Connect customer actions to operational workflows."
  }
};

export const projectSeo: Readonly<Record<string, SeoCopy>> = {
  "aegis-sentinel": {
    title: "Aegis Sentinel | Computer Vision & Evidence Systems",
    description:
      "An inside look at Aegis Sentinel's computer vision and evidence review architecture, connecting observations, case records and human decisions."
  },
  "laugh-and-lodge": {
    title: "Laugh & Lodge | Booking Marketplace Case Study",
    description:
      "Explore a hospitality booking platform designed around property discovery, availability holds, checkout states and the operational side of reservations."
  },
  "kt-couriers": {
    title: "KT Couriers | Logistics & Dispatch Software Case Study",
    description:
      "Explore how the KT Couriers product connects orders, merchants, dispatch, drivers, delivery evidence and operational responsibilities."
  },
  "math-intellect": {
    title: "Math Intellect | Mathematical Simulation & Learning Platform",
    description:
      "Explore a mathematical simulation and learning experience that makes models, scenarios and interactive reasoning more accessible."
  },
  "personality-assessor": {
    title: "Personality Assessor | Assessment Software Case Study",
    description:
      "A closer look at a personality assessment experience designed around transparent scoring, structured responses and explainable results."
  }
};

/** A Vercel preview, a local server or an unexpected domain must never invite indexing. */
export function mayIndexPublicSite(): boolean {
  if (process.env["APP_ENV"] !== "production") return false;
  if (process.env["VERCEL_ENV"] && process.env["VERCEL_ENV"] !== "production") {
    return false;
  }
  const trusted = getTrustedBaseUrl();
  if (!trusted) return false;
  try {
    const url = new URL(trusted);
    return (
      url.protocol === "https:" &&
      url.hostname === "valtumstudio.com.au" &&
      url.pathname === "/"
    );
  } catch {
    return false;
  }
}

/** Only actual public, canonical routes belong in the discovery sitemap. */
export function indexablePublicPaths(): string[] {
  const paths = [
    "/",
    "/solutions",
    "/services",
    "/work",
    "/studio",
    "/approach",
    "/contact",
    "/privacy",
    ...serviceStories.map((service) => "/services/" + service.slug),
    ...stories.map((story) => "/work/" + story.slug)
  ];
  return [...new Set(paths)];
}

export function publicCanonical(path: string): string {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("?") ||
    path.includes("#")
  ) {
    throw new Error("Expected a trusted canonical page path.");
  }
  return SEO_ORIGIN + (path === "/" ? "" : path.replace(/\/$/, ""));
}

export function publicPageMetadata(
  copy: SeoCopy,
  path: string,
  imagePath?: string
): Metadata {
  const canonical = publicCanonical(path);
  const socialImage = imagePath ? publicCanonical(imagePath) : SEO_SOCIAL_IMAGE;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: "Valtum Studio",
      locale: "en_AU",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: "Valtum Studio software and design work"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [socialImage]
    },
    robots: mayIndexPublicSite()
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } }
  };
}
