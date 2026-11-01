import Image from "next/image";
import Link from "next/link";

import { type ProjectStory, stories } from "./content";
import { DevicePreview } from "./DevicePreview";
import { productLinks } from "./product-links";
import { RevealText } from "./RevealText";
import { StoryExperience } from "./StoryExperience";
const editorial: Record<
  string,
  { image: string; alt: string; title: string; lead: string; context: string }
> = {
  aegis: {
    image: "light",
    alt: "The geometry of a building seen from below",
    title: "Beyond the observation.",
    lead: "Noticing something is the beginning of an investigation. Aegis Sentinel gives that observation a source, a history and a place for human judgment.",
    context:
      "The interface had to connect visual intelligence with the slower, more careful work of examining evidence. We shaped the experience around the person asking what an observation actually supports."
  },
  lodge: {
    image: "architecture",
    alt: "A person moving through a spacious architectural setting",
    title: "A little closer to the stay.",
    lead: "A guest imagines being there long before they arrive. Laugh & Lodge brings that anticipation together with the practical work of finding, reserving and managing a place to stay.",
    context:
      "The design had to feel welcoming without making the transaction vague. We followed the reservation beyond the room photograph, into the dates, the payment and the host’s responsibilities."
  },
  courier: {
    image: "collaboration",
    alt: "People coordinating work around a shared table",
    title: "Every handoff matters.",
    lead: "The customer sees a delivery. The business sees a chain of responsibilities. KT Couriers connects the people, actions and records that move an order forward.",
    context:
      "We treated the shipment as one continuous story across customer, merchant, driver and operations. The interface changes with the role, while the order keeps its identity."
  },
  math: {
    image: "paper",
    alt: "Drawing tools and a notebook prepared for a new idea",
    title: "Change the question.",
    lead: "A useful model makes its assumptions visible. Math Intellect gives curious people a way to change a condition, run a calculation and examine what follows.",
    context:
      "The experience needed room for curiosity and a clear boundary around interpretation. A result should be something a person can investigate, rather than a chart that asks to be believed."
  },
  personality: {
    image: "detail",
    alt: "A thoughtful conversation over information on a laptop",
    title: "An answer is a beginning.",
    lead: "People are more complicated than a score. Personality Assessor keeps the original response close as it moves through structured evidence, interpretation and career exploration.",
    context:
      "The design challenge was to make an assessment understandable without presenting it as an identity or a diagnosis. We kept the answer, the calculation and the explanation as connected, distinct parts of the experience."
  }
};
export function CaseStudy({ story }: { story: ProjectStory }): React.JSX.Element {
  const next =
    stories[(stories.findIndex((s) => s.slug === story.slug) + 1) % stories.length] ??
    story;
  const direction = editorial[story.theme] ?? editorial["aegis"];
  if (!direction) return <></>;
  return (
    <main className={`v-case x-case v-case-${story.theme}`} id="main-content">
      <section className="x-case-opening">
        <div>
          <Link className="x-link" href="/work">
            ← All work
          </Link>
          <h1>{story.title}</h1>
          <p>{direction.title}</p>
        </div>
        <div className="x-case-intro-device" data-device-stage>
          <DevicePreview theme={story.theme} title={story.title} eager />
        </div>
        <div className="x-case-actions">
          <p>{story.field}</p>
          <a
            className="x-link"
            href={productLinks[story.theme]}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit the website ↗
          </a>
          <a className="x-link" href="#the-story">
            Inside the project ↓
          </a>
        </div>
      </section>
      <section className="x-case-lede" id="the-story">
        <RevealText text={direction.lead} />
        <p>{direction.context}</p>
      </section>
      <section className="x-case-tension">
        <div className="x-case-world">
          <Image
            src={`/editorial/${direction.image}.webp`}
            alt={direction.alt}
            fill
            sizes="(max-width:760px) 100vw, 50vw"
            data-parallax
          />
        </div>
        <div>
          <h2 data-reveal>{story.question}</h2>
          <p>{story.answer}</p>
        </div>
      </section>
      <section className="x-case-responsive">
        <div>
          <h2 data-reveal>
            Every screen.
            <br />
            The same intention.
          </h2>
          <p>
            The experience is reworked for a smaller screen, with the same care for the
            journey. Explore the live site or open it in your browser.
          </p>
        </div>
        <div className="x-case-responsive-phone">
          <DevicePreview theme={story.theme} title={story.title} phone interactive />
        </div>
      </section>
      <section className="x-case-sequence">
        <h2 data-reveal>Follow the decision.</h2>
        <div className="x-journey">
          {story.sequence.map((step, i) => (
            <div key={step}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
              {i < story.sequence.length - 1 && <i aria-hidden="true">↗</i>}
            </div>
          ))}
        </div>
        <p>A simplified illustration of the product workflow.</p>
      </section>
      <StoryExperience theme={story.theme} />
      <div className="x-case-decisions">
        {story.chapters.map((chapter, i) => (
          <section className="x-decision-card" data-stack key={chapter.title}>
            <div>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </div>
            <figure>
              <Image
                src={
                  i === 0
                    ? story.image
                    : `/editorial/${i === 1 ? "sketch" : "paper"}.webp`
                }
                alt={
                  i === 0
                    ? `${story.title} public website`
                    : "Editorial detail of the design and planning process"
                }
                fill
                sizes="(max-width:760px) 90vw, 45vw"
              />
              <figcaption>
                {i === 0
                  ? "The public experience"
                  : i === 1
                    ? "Designing the decisions"
                    : "Making the reasoning clear"}
              </figcaption>
            </figure>
          </section>
        ))}
      </div>
      <section className="x-case-conclusion">
        <h2 data-word-reveal>
          {story.detail.replace("The engineering decision: ", "")}
        </h2>
        <Link className="x-link" href="/services">
          What could we build for you? ↗
        </Link>
      </section>
      <section className="x-next-case">
        <div>
          <h2>{next.title}</h2>
          <p>{next.premise}</p>
          <Link className="x-button" href={`/work/${next.slug}`}>
            Open the next story ↗
          </Link>
        </div>
        <DevicePreview theme={next.theme} title={next.title} />
      </section>
    </main>
  );
}
