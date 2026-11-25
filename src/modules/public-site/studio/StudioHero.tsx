"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  featured = false,
  priority = false
}: {
  project: HeroProject;
  featured?: boolean;
  priority?: boolean;
}): React.JSX.Element {
  return (
    <div className="h-hero-print" style={{ backgroundColor: project.colour }}>
      <div className="h-hero-image">
        <picture>
          <source
            media="(max-width: 760px)"
            srcSet={`/products/${project.image}-mobile.webp`}
          />
          <img
            src={`/products/${project.image}.webp`}
            alt={featured ? `${project.name} website preview` : ""}
            width={1440}
            height={900}
            loading="eager"
            fetchPriority={priority ? "high" : "low"}
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
  const work = useRef<HTMLDivElement>(null);
  const focusNextCard = useRef(false);
  const current = projects[active] ?? projects[0];
  const slots = ["front", "next", "far-next", "far-previous", "previous"] as const;
  const advance = (direction: number) =>
    setActive((index) => (index + direction + projects.length) % projects.length);

  useEffect(() => {
    if (!focusNextCard.current) return;
    focusNextCard.current = false;
    work.current?.querySelector<HTMLElement>('[data-slot="front"]')?.focus({
      preventScroll: true
    });
  }, [active]);

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
          ref={work}
          role="region"
          aria-label="Explore our projects"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
              event.preventDefault();
              focusNextCard.current = true;
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
          {projects.map((project, index) => {
            const slot = slots[(index - active + projects.length) % projects.length];
            const featured = slot === "front";
            return (
              <Link
                key={project.slug}
                className={featured ? "h-hero-card h-hero-front" : "h-hero-card"}
                data-slot={slot}
                href={`/work/${project.slug}`}
                aria-label={`View ${project.name} case study`}
                aria-hidden={!featured}
                tabIndex={featured ? 0 : -1}
                draggable={false}
              >
                <ProjectPrint
                  project={project}
                  featured={featured}
                  priority={index === 0}
                />
              </Link>
            );
          })}
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
