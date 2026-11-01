"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { serviceStories } from "./services";
export function ServiceAccordion(): React.JSX.Element {
  const [active, setActive] = useState(0);
  return (
    <div className="x-service-accordion">
      {serviceStories.map((service, i) => (
        <article
          className={`x-service-panel ${active === i ? "is-active" : ""}`}
          key={service.slug}
        >
          <button
            aria-expanded={active === i}
            aria-controls={`service-panel-${service.slug}`}
            onClick={() => setActive(i)}
          >
            <span>{service.title}</span>
            <span aria-hidden="true">{active === i ? "↗" : "+"}</span>
          </button>
          <div
            className="x-service-panel-content"
            id={`service-panel-${service.slug}`}
            hidden={active !== i}
          >
            <Image
              src={`/editorial/${service.image}.webp`}
              alt={service.alt}
              width={1000}
              height={1000}
              sizes="(max-width:760px) 85vw, 45vw"
            />
            <div>
              <h3>{service.short}</h3>
              <p>{service.intro}</p>
              <Link href={`/services/${service.slug}`} className="x-link">
                Explore {service.title.toLowerCase()} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
