"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type {
  PublicMediaDTO,
  PublicProjectDTO
} from "@/modules/public-content/types/dto";

import styles from "./home.module.css";

type VisualProject = Readonly<{ media: PublicMediaDTO; project: PublicProjectDTO }>;

function displayMedia(project: PublicProjectDTO): PublicMediaDTO | null {
  if (project.coverAsset?.mimeType.startsWith("image/")) return project.coverAsset;
  return (
    project.media.find((item) => item.mediaAsset.mimeType.startsWith("image/"))
      ?.mediaAsset ?? null
  );
}

function ProjectImage({
  media,
  title
}: Readonly<{ media: PublicMediaDTO; title: string }>): React.JSX.Element {
  return (
    <Image
      alt={media.altText?.trim() || `${title} project interface`}
      className={styles.heroImage}
      height={media.height ?? 1000}
      sizes="(max-width: 800px) calc(100vw - 40px), 55vw"
      src={media.url}
      width={media.width ?? 1600}
    />
  );
}

export function SelectedWorkSection({
  projects
}: Readonly<{ projects: ReadonlyArray<PublicProjectDTO> }>): React.JSX.Element | null {
  const visualProjects = projects
    .map((project) => ({ media: displayMedia(project), project }))
    .filter((item): item is VisualProject => item.media !== null);
  const [activeIndex, setActiveIndex] = useState(0);
  const observations = useRef<Array<HTMLElement | null>>([]);
  const active = visualProjects[activeIndex] ?? visualProjects[0];

  useEffect(() => {
    if (visualProjects.length < 2 || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) => second.intersectionRatio - first.intersectionRatio
          )[0];
        if (!visible) return;
        const index = Number(visible.target.getAttribute("data-project-index"));
        if (Number.isInteger(index)) setActiveIndex(index);
      },
      { rootMargin: "-25% 0px -45% 0px", threshold: [0.1, 0.5, 0.9] }
    );
    observations.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [visualProjects.length]);

  if (!active || visualProjects.length === 0) return null;
  return (
    <section aria-labelledby="work-heading" className={styles.section} id="work">
      <div className={styles.container}>
        <div className={styles.workHeader}>
          <p className={styles.label}>Selected work</p>
          <h2 className={styles.sectionTitle} id="work-heading">
            Evidence, not theatre.
          </h2>
          <p className={styles.sectionIntro}>
            A selection of products and systems shaped around the detail that makes them
            useful.
          </p>
        </div>
        <div className={styles.workLayout}>
          <div className={styles.workObservations}>
            {visualProjects.map(({ media, project }, index) => (
              <article
                className={styles.workObservation}
                data-project-index={index}
                key={project.id}
                ref={(node) => {
                  observations.current[index] = node;
                }}
              >
                <p className={styles.projectNumber}>
                  {String(index + 1).padStart(2, "0")} /{" "}
                  {String(visualProjects.length).padStart(2, "0")}
                </p>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectSummary}>{project.summary}</p>
                <div className={styles.projectMeta}>
                  {project.projectYear ? <span>{project.projectYear}</span> : null}
                  {project.services.map((service) => (
                    <span key={service.id}>{service.title}</span>
                  ))}
                  {project.technologies.map((technology) => (
                    <span key={technology.slug}>{technology.name}</span>
                  ))}
                </div>
                <div className={styles.workMobileMedia}>
                  <ProjectImage media={media} title={project.title} />
                </div>
              </article>
            ))}
          </div>
          <div aria-live="polite" className={styles.workStage}>
            <p className={styles.projectNumber}>
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(visualProjects.length).padStart(2, "0")}
            </p>
            <div className={styles.projectMedia}>
              <ProjectImage
                key={active.project.id}
                media={active.media}
                title={active.project.title}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
