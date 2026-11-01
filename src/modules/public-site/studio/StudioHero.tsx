"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const projects = [
  { image: "aegis", name: "Aegis Sentinel", slug: "aegis-sentinel", colour: "#cbd5ce" },
  { image: "lodge", name: "Laugh & Lodge", slug: "laugh-and-lodge", colour: "#e2e9e4" },
  { image: "math", name: "MathIntellect", slug: "math-intellect", colour: "#faf9f5" },
  { image: "courier", name: "KT Couriers", slug: "kt-couriers", colour: "#f6f3ed" },
  {
    image: "personality",
    name: "Personality Assessor",
    slug: "personality-assessor",
    colour: "#f0eeea"
  }
] as const;

type HeroProject = (typeof projects)[number];

function ProjectPrint({
  project,
  featured = false
}: {
  project: HeroProject;
  featured?: boolean;
}): React.JSX.Element {
  return (
    <div className="h-hero-print" style={{ backgroundColor: project.colour }}>
      <div className="h-hero-image">
        <picture key={project.image}>
          <source
            media="(max-width: 760px)"
            srcSet={`/products/${project.image}-mobile.webp`}
          />
          <img
            src={`/products/${project.image}.webp`}
            alt={featured ? `${project.name} website preview` : ""}
            width={1440}
            height={900}
            loading={featured ? "eager" : "lazy"}
            fetchPriority={featured ? "high" : "auto"}
            decoding="async"
          />
        </picture>
      </div>
      <div className="h-hero-print-caption" aria-hidden="true">
        <span>{project.name}</span>
        <span>↗</span>
      </div>
    </div>
  );
}

export function StudioHero(): React.JSX.Element {
  const [active, setActive] = useState(0);
  const start = useRef<number | null>(null);
  const dragged = useRef(false);
  const current = projects[active] ?? projects[0];
  const previous =
    projects[(active + projects.length - 1) % projects.length] ?? projects[0];
  const next = projects[(active + 1) % projects.length] ?? projects[0];
  const advance = (direction: number) =>
    setActive((index) => (index + direction + projects.length) % projects.length);

  return (
    <section className="h-hero" data-cinema aria-labelledby="hero-heading">
      <div className="h-hero-stage">
        <div className="h-hero-copy">
          <h1 id="hero-heading">
            <span>Good ideas.</span>
            <span>Beautifully built.</span>
          </h1>
          <p>
            Websites that earn attention. Software that makes work easier. We design and
            build both, from Australia for businesses around the world.
          </p>
          <div className="h-hero-actions">
            <Link className="x-button" href="/contact">
              Start a project <span aria-hidden="true">↗</span>
            </Link>
            <Link className="x-link" href="/work">
              Explore our work <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div
          className="h-hero-work"
          role="region"
          aria-label="Explore our projects"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              advance(event.key === "ArrowRight" ? 1 : -1);
            }
          }}
          onPointerDown={(event) => {
            start.current = event.clientX;
            dragged.current = false;
          }}
          onPointerUp={(event) => {
            if (
              start.current !== null &&
              Math.abs(event.clientX - start.current) > 36
            ) {
              dragged.current = true;
              advance(event.clientX < start.current ? 1 : -1);
            }
            start.current = null;
          }}
          onPointerCancel={() => {
            start.current = null;
          }}
          onClickCapture={(event) => {
            if (dragged.current) {
              event.preventDefault();
              dragged.current = false;
            }
          }}
        >
          <div className="h-hero-back h-hero-back-first" aria-hidden="true">
            <ProjectPrint project={previous} />
          </div>
          <div className="h-hero-back h-hero-back-last" aria-hidden="true">
            <ProjectPrint project={next} />
          </div>
          <Link
            className="h-hero-front"
            href={`/work/${current.slug}`}
            aria-label={`View ${current.name} case study`}
            draggable={false}
          >
            <ProjectPrint project={current} featured />
          </Link>
        </div>
        <div className="h-hero-browser" aria-label="Choose a project">
          <p className="h-hero-current" aria-live="polite">
            {current.name}
          </p>
          <button
            type="button"
            aria-label="Previous project"
            onClick={() => advance(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" aria-label="Next project" onClick={() => advance(1)}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <a className="h-hero-scroll" href="#studio-introduction">
          A closer look <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
