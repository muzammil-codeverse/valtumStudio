import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  InlinePhoto,
  MediaTakeover,
  PracticeReel
} from "@/modules/public-site/studio/SceneElements";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";
import { SeoBreadcrumb } from "@/modules/public-site/studio/SeoBreadcrumb";
import { serviceStories } from "@/modules/public-site/studio/services";
export const metadata: Metadata = publicPageMetadata(pageSeo.services, "/services");
export default function ServicesPage(): React.JSX.Element {
  return (
    <main className="x-services-page" id="main-content">
      <SeoBreadcrumb title="Services" path="/services" />
      <header className="m-services-opening">
        <div className="m-services-title">
          <h1>
            Good thinking.
            <br />
            <em>Working software.</em>
          </h1>
          <p>
            One studio. The right combination of disciplines for the work in front of
            you.
          </p>
        </div>
        <div className="m-service-fan" aria-hidden="true">
          {["sculpture", "sketch", "architecture"].map((image, i) => (
            <div key={image} className={`m-fan-${i}`}>
              <Image
                src={`/editorial/${image}.webp`}
                alt=""
                fill
                priority={i === 1}
                sizes="35vw"
              />
            </div>
          ))}
        </div>
        <nav aria-label="Explore services">
          {serviceStories.map((service) => (
            <Link href={`#${service.slug}`} key={service.slug}>
              {service.title}
              <span>↗</span>
            </Link>
          ))}
        </nav>
      </header>
      <PracticeReel />
      <section className="m-service-practice">
        <div className="m-service-aside">
          <h2>
            Different skills.
            <br />
            <InlinePhoto name="spiral" /> Shared intent.
          </h2>
          <p>
            Choose the part you need now. We will help you understand how it connects to
            the rest.
          </p>
          <Link className="x-link" href="/contact">
            Talk through your brief ↗
          </Link>
        </div>
        <div className="x-service-index">
          {serviceStories.map((service) => (
            <article id={service.slug} key={service.slug} data-service-card data-stack>
              <div className="x-service-index-image" data-curtain-image>
                <Image
                  src={`/editorial/${service.image}.webp`}
                  alt={service.alt}
                  fill
                  sizes="(max-width:760px) 90vw, 45vw"
                />
              </div>
              <div>
                <h2>{service.title}</h2>
                <h3>{service.short}</h3>
                <p>{service.intro}</p>
                <ul>
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link className="x-link" href={`/services/${service.slug}`}>
                  Inside this service ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <MediaTakeover
        image="detail"
        alt="A shared conversation about a digital interface"
        title="The value is in how it all comes together."
        body="A clear idea, expressed through design and carried through the engineering. Every part of the work answers to the same brief."
      />
      <section className="x-service-end" data-cover-scene>
        <h2 data-word-reveal>
          You do not need to
          <br />
          know the whole brief yet.
        </h2>
        <p>
          Start with the problem, the possibility or the part that is keeping you stuck.
          We will work out the useful next question together.
        </p>
        <Link href="/contact" className="x-button">
          Tell us what is on your mind ↗
        </Link>
        <Link href="/solutions" className="x-link">
          See the business challenges we work on ↗
        </Link>
      </section>
    </main>
  );
}
