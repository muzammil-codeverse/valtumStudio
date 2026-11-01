import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStory } from "@/modules/public-site/studio/content";
import { DevicePreview } from "@/modules/public-site/studio/DevicePreview";
import { RevealText } from "@/modules/public-site/studio/RevealText";
import { InlinePhoto, MediaTakeover } from "@/modules/public-site/studio/SceneElements";
import { getService } from "@/modules/public-site/studio/services";
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  return {
    title: `${service?.title ?? "Service"} | Valtum Studio`,
    description: service?.intro,
    alternates: { canonical: `/services/${slug}` }
  };
}
export default async function ServicePage({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();
  const proof = getStory(service.proof);
  return (
    <main className="x-service-detail" id="main-content">
      <header className="x-editorial-heading">
        <div>
          <Link className="x-link" href="/services">
            ← All services
          </Link>
          <h1>{service.title}</h1>
        </div>
        <p>{service.intro}</p>
      </header>
      <figure className="x-detail-panorama" data-media-reveal>
        <Image
          src={`/editorial/${service.image}.webp`}
          alt={service.alt}
          fill
          priority
          sizes="100vw"
          data-parallax
        />
      </figure>
      <section className="x-service-reason" data-cover-scene>
        <RevealText text={service.challenge} />
        <p>{service.approach}</p>
      </section>
      <section className="x-service-delivery">
        <div>
          <h2>
            What we <InlinePhoto name={service.image} /> bring
            <br />
            to the work.
          </h2>
          <ul>
            {service.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>
            What you
            <br />
            take forward.
          </h2>
          <p>{service.outcome}</p>
        </div>
      </section>
      {proof && (
        <section className="x-service-proof">
          <div>
            <h2>
              See the thinking
              <br />
              in practice.
            </h2>
            <p>{proof.premise}</p>
            <Link className="x-link" href={`/work/${proof.slug}`}>
              Explore {proof.title} ↗
            </Link>
          </div>
          <DevicePreview theme={proof.theme} title={proof.title} />
        </section>
      )}
      <MediaTakeover
        image={service.image}
        alt={service.alt}
        title={service.short}
        body={service.outcome}
      />
      <section className="x-service-end">
        <h2 data-reveal>
          What would make
          <br />
          this worth building?
        </h2>
        <Link className="x-button" href="/contact">
          Let’s talk about it ↗
        </Link>
      </section>
    </main>
  );
}
