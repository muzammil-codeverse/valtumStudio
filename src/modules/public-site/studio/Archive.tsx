"use client";

import Link from "next/link";
import { useState } from "react";

import { type ProjectStory } from "./content";
import { DevicePreview } from "./DevicePreview";
import { FolioLink } from "./StudioShell";

export function Archive({
  projects,
  full = false
}: {
  projects: ReadonlyArray<ProjectStory>;
  full?: boolean;
}): React.JSX.Element {
  const [filter, setFilter] = useState("All work");
  const visible = projects.filter(
    (p) =>
      filter === "All work" ||
      (filter === "Intelligence"
        ? ["aegis", "math", "personality"].includes(p.theme)
        : ["lodge", "courier"].includes(p.theme))
  );
  return (
    <section
      aria-labelledby="archive-heading"
      className={`v-archive ${full ? "v-archive-full" : "x-archive-horizontal"}`}
      id="work"
    >
      <div className="v-archive-intro" data-reveal>
        <h2 id="archive-heading">
          Different challenges.
          <br />
          <em>Considered answers.</em>
        </h2>
        <p>
          A selection of products shaped around
          <br />
          the people and decisions behind them.
        </p>
      </div>
      {full && (
        <div aria-label="Filter projects" className="v-filters">
          {["All work", "Platforms", "Intelligence"].map((item) => (
            <button
              aria-pressed={filter === item}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      <div
        className={full ? undefined : "x-work-runway"}
        data-work-runway={full ? undefined : true}
      >
        <div className="x-work-window" data-work-window={full ? undefined : true}>
          <div className="v-folio-grid">
            {visible.map((project) => (
              <article
                className={`v-folio v-folio-${project.theme}`}
                key={project.slug}
              >
                <FolioLink
                  alt={project.alt}
                  className="v-folio-link"
                  href={`/work/${project.slug}`}
                  image={project.image}
                >
                  <div className="v-folio-tab">
                    <span>{project.title}</span>
                  </div>
                  <div className="v-folio-body">
                    <div className="v-folio-photo">
                      <DevicePreview theme={project.theme} title={project.title} />
                      <div className="v-folio-mobile">
                        <DevicePreview
                          theme={project.theme}
                          title={project.title}
                          phone
                        />
                      </div>
                    </div>
                    <div className="v-folio-cover" aria-hidden="true">
                      <span>{project.title}</span>
                      <span>↗</span>
                    </div>
                  </div>
                  <div className="v-folio-info">
                    <h3>{project.title}</h3>
                    <span aria-hidden="true">↗</span>
                    <p>{project.premise}</p>
                    <small>{project.field}</small>
                  </div>
                </FolioLink>
              </article>
            ))}
          </div>
        </div>
      </div>
      {!full && (
        <Link className="x-link x-archive-all" href="/work">
          Open the complete archive ↗
        </Link>
      )}
    </section>
  );
}
