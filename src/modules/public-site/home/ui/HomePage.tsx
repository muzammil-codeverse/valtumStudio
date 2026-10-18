import Image from "next/image";

import type {
  PublicMediaDTO,
  PublicProjectDTO
} from "@/modules/public-content/types/dto";

import {
  defaultCapabilities,
  homeNavigation,
  type HomePageData
} from "../data/home-data";
import { CapabilitiesSection } from "./CapabilitiesSection";
import styles from "./home.module.css";
import { InquiryForm } from "./InquiryForm";
import { SelectedWorkSection } from "./SelectedWorkSection";
import { SiteHeader } from "./SiteHeader";

const processStages = [
  ["Understand", "Clarify the problem, users, constraints and commercial context."],
  ["Frame", "Define the product boundary, workflows and measurable priorities."],
  [
    "Architect",
    "Design the experience, system structure, data model and delivery strategy."
  ],
  ["Build", "Implement the product through disciplined, reviewable increments."],
  [
    "Validate",
    "Test behaviour, security, accessibility, performance and operational readiness."
  ],
  ["Evolve", "Improve the product using real usage, evidence and changing priorities."]
] as const;

const systemLayers = [
  ["Experience", "Interfaces and workflows shaped around real users."],
  ["Application", "Maintainable product logic and dependable integrations."],
  ["Intelligence", "AI and automation applied where they create measurable clarity."],
  ["Data", "Information designed for quality, visibility and useful decisions."],
  ["Infrastructure", "Operational foundations that support dependable change."],
  ["Assurance", "Security, accessibility and performance considered throughout."]
] as const;

function displayMedia(project: PublicProjectDTO): PublicMediaDTO | null {
  if (project.coverAsset?.mimeType.startsWith("image/")) return project.coverAsset;
  const supporting = project.media.find((item) =>
    item.mediaAsset.mimeType.startsWith("image/")
  );
  return supporting?.mediaAsset ?? null;
}

function ProjectImage({
  media,
  priority,
  title
}: Readonly<{
  media: PublicMediaDTO;
  priority?: boolean;
  title: string;
}>): React.JSX.Element {
  const width = media.width ?? 1600;
  const height = media.height ?? 1000;
  return (
    <Image
      alt={media.altText?.trim() || `${title} project interface`}
      className={styles.heroImage}
      height={height}
      priority={priority ?? false}
      sizes="(max-width: 800px) calc(100vw - 40px), 65vw"
      src={media.url}
      width={width}
    />
  );
}

function HeroStage({
  project
}: Readonly<{ project: PublicProjectDTO | null }>): React.JSX.Element {
  const media = project ? displayMedia(project) : null;
  if (media) {
    return (
      <div className={styles.heroStage}>
        <ProjectImage
          media={media}
          priority
          title={project?.title ?? "Siglum Studio"}
        />
      </div>
    );
  }
  return (
    <div aria-label="Siglum Studio structural media stage" className={styles.heroStage}>
      <div className={styles.heroFallback}>
        <p className={styles.stageWordmark}>Siglum Studio / Product systems</p>
        <p className={styles.stageStatement}>
          Designed for the work beneath the interface.
        </p>
      </div>
    </div>
  );
}

function StudioSection({
  team
}: Readonly<{ team: HomePageData["team"] }>): React.JSX.Element {
  return (
    <section
      aria-labelledby="studio-heading"
      className={`${styles.section} ${styles.studio}`}
      id="studio"
    >
      <div className={styles.container}>
        <div className={styles.studioGrid}>
          <div className={styles.studioText}>
            <p className={styles.label}>Studio</p>
            <h2 className={styles.sectionTitle} id="studio-heading">
              Australia-based. Built for global work.
            </h2>
            <p>
              Siglum brings product thinking, technical depth and careful execution into
              one accountable studio practice.
            </p>
          </div>
          <p className={styles.studioDetail}>
            We work where complexity needs a considered route from first decision to
            production reality.
          </p>
          {team.length > 0 ? (
            <div className={styles.teamList}>
              {team.map((member) => (
                <div className={styles.teamMember} key={member.slug}>
                  <strong>{member.name}</strong>
                  <span>{member.roleTitle}</span>
                  <p>{member.shortBio ?? member.bioText ?? ""}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HomePage({
  projects,
  services,
  settings,
  team
}: HomePageData): React.JSX.Element {
  const heroProject =
    projects.find((project) => displayMedia(project) !== null) ?? null;
  const hasSelectedWork = projects.some((project) => displayMedia(project) !== null);
  const studioName = settings.studioName || "Siglum Studio";
  const capabilities =
    services.length > 0
      ? services.map((service) => ({
          title: service.title,
          description: service.description ?? service.summary
        }))
      : defaultCapabilities;
  return (
    <div className={styles.home} id="top">
      <SiteHeader studioName={studioName} />
      <main id="main-content">
        <section
          aria-labelledby="hero-heading"
          className={`${styles.hero} ${styles.container}`}
        >
          <div className={styles.heroGrid}>
            <div className={styles.heroIntro}>
              <p className={styles.label}>
                Independent digital product and engineering studio
              </p>
              <h1 className={styles.heroTitle} id="hero-heading">
                Clarity from complexity.
              </h1>
            </div>
            <div className={styles.heroDetails}>
              <div>
                <p className={styles.heroCopy}>
                  We design and engineer digital products, intelligent systems and
                  platforms for organisations with serious problems to solve.
                </p>
                <div className={styles.heroButtons}>
                  <a className={styles.buttonPrimary} href="#contact">
                    Start a project
                  </a>
                  <a className={styles.buttonSecondary} href="#work">
                    Explore selected work
                  </a>
                </div>
              </div>
              <div className={styles.heroLocations}>
                <span className={styles.metadata}>Australia-based</span>
                <span className={styles.metadata}>Working globally</span>
              </div>
            </div>
          </div>
          <HeroStage project={heroProject} />
        </section>

        <section
          aria-labelledby="thesis-heading"
          className={`${styles.section} ${styles.thesis}`}
        >
          <div className={styles.container}>
            <div className={styles.thesisGrid}>
              <h2 className={styles.thesisTitle} id="thesis-heading">
                Complex ideas become useful products when strategy, design and
                engineering move as one.
              </h2>
              <p className={styles.thesisCopy}>
                From product definition and interface design to architecture,
                implementation and production evolution, the work stays connected to the
                problem it is there to solve.
              </p>
              <div className={styles.capabilityColumns}>
                <div>
                  <h3>Products</h3>
                  <p>Platforms and experiences people can actually use.</p>
                </div>
                <div>
                  <h3>Intelligence</h3>
                  <p>AI, automation, data and computer vision applied with purpose.</p>
                </div>
                <div>
                  <h3>Systems</h3>
                  <p>Backends, infrastructure and architecture designed to endure.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasSelectedWork ? (
          <SelectedWorkSection projects={projects} />
        ) : (
          <span aria-hidden="true" id="work" />
        )}
        <CapabilitiesSection capabilities={capabilities} />

        <section
          aria-labelledby="process-heading"
          className={styles.section}
          id="process"
        >
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <p className={styles.label}>Process</p>
              <h2 className={styles.sectionTitle} id="process-heading">
                How Siglum works
              </h2>
            </div>
            <div className={styles.processPath}>
              {processStages.map(([title, description], index) => (
                <article className={styles.processStage} key={title}>
                  <p className={styles.processIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="depth-heading"
          className={`${styles.section} ${styles.depth}`}
        >
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <p className={styles.label}>Technical depth</p>
              <h2 className={styles.sectionTitle} id="depth-heading">
                The interface is only the visible layer.
              </h2>
            </div>
            <div className={styles.layerList}>
              {systemLayers.map(([title, description], index) => (
                <article className={styles.layer} key={title}>
                  <p className={styles.layerIndex}>0{index + 1}</p>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <StudioSection team={team} />
        <section
          aria-labelledby="contact-heading"
          className={`${styles.section} ${styles.contact}`}
          id="contact"
        >
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              <h2 className={styles.contactTitle} id="contact-heading">
                Have something complex to build?
                <br />
                Let’s make it clear.
              </h2>
              <div className={styles.contactAside}>
                <p>
                  Tell us what you are building, where the complexity is, and what
                  success should look like.
                </p>
                <InquiryForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div>
            <p className={styles.wordmark}>{studioName}</p>
            <p className={styles.footerContact}>Australia-based / global-first</p>
          </div>
          <nav aria-label="Footer navigation" className={styles.footerLinks}>
            {homeNavigation.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            {settings.publicEmail ? (
              <a href={`mailto:${settings.publicEmail}`}>{settings.publicEmail}</a>
            ) : null}
            {settings.publicSocialLinks?.linkedinUrl ? (
              <a
                href={settings.publicSocialLinks.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
            ) : null}
            {settings.publicSocialLinks?.instagramUrl ? (
              <a
                href={settings.publicSocialLinks.instagramUrl}
                rel="noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            ) : null}
          </nav>
          <p className={styles.footerMeta}>
            © {new Date().getFullYear()} {studioName}
          </p>
        </div>
      </footer>
    </div>
  );
}
