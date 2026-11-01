import Image from "next/image";
import Link from "next/link";

import { Archive } from "../../studio/Archive";
import { stories } from "../../studio/content";
import { DevicePreview } from "../../studio/DevicePreview";
import { studioJournal as journal } from "../../studio/journal";
import { CinematicHero, InlinePhoto, MediaTakeover } from "../../studio/SceneElements";
import { ServiceAccordion } from "../../studio/ServiceAccordion";
import { TurningBook } from "../../studio/TurningBook";
import type { HomePageData } from "../data/home-data";

const orbit = [
  ["light", "Light across a geometric building"],
  ["sketch", "A product drawing taking shape"],
  ["paper", "Drawing tools and a notebook"],
  ["collaboration", "Laptops and notes on a shared work surface"],
  ["sydney", "Sydney Harbour and its architectural landmarks"],
  ["detail", "A conversation over a laptop"],
  ["architecture", "A person moving through a designed space"],
  ["sketch", "The detail of a technical drawing"]
];
export function HomePage({ team }: HomePageData): React.JSX.Element {
  return (
    <main className="x-home" id="main-content">
      <CinematicHero />
      <section className="x-intro" id="studio-introduction" data-cover-scene>
        <h2 data-word-reveal>
          A sharper <InlinePhoto name="sculpture" /> experience.
          <br />A stronger business.
          <br />
          <span className="x-inline-photo">
            <Image
              src="/editorial/sketch.webp"
              alt="A close look at the creative process"
              fill
              sizes="120px"
            />
          </span>{" "}
          The two belong together.
        </h2>
        <div className="x-intro-prose" data-reveal>
          <p>
            You might be making your first product, untangling a difficult process or
            giving a good business the website it deserves.
          </p>
          <p>
            Valtum brings the creative thinking and the engineering into one
            conversation. From Australia, we work directly with founders and teams
            around the world, staying close to the idea and the people it is for.
          </p>
          <Link className="x-link" href="/studio">
            Meet the studio ↗
          </Link>
        </div>
      </section>
      <section className="x-device-story" data-section-shift>
        <div className="x-device-story-copy">
          <h2 data-word-reveal>
            Simple on the surface.
            <br />
            Considered all the way through.
          </h2>
          <p>
            What people see should feel natural. The decisions behind it deserve just as
            much care.
          </p>
        </div>
        <div className="x-device-pair" data-device-stage>
          <DevicePreview theme="aegis" title="Aegis Sentinel" />
          <div className="x-pair-phone">
            <DevicePreview theme="lodge" title="Laugh & Lodge" phone />
          </div>
        </div>
        <Link className="x-link" href="/work">
          Explore the work behind the screens ↗
        </Link>
      </section>
      <section className="x-services-home" data-cover-scene>
        <div className="x-section-heading">
          <h2 data-reveal>
            What are you
            <br />
            ready to <InlinePhoto name="spiral" /> change?
          </h2>
          <p>
            A new product. A better way of working.
            <br />A presence that feels like you.
          </p>
        </div>
        <ServiceAccordion />
        <Link className="x-link x-section-link" href="/services">
          See all services ↗
        </Link>
      </section>
      <section className="x-orbit" data-orbit>
        <div className="x-orbit-images" aria-hidden="true">
          {orbit.map(([name, alt], i) => (
            <div className={`x-orbit-image orbit-${i}`} key={i}>
              <Image
                src={`/editorial/${name}.webp`}
                alt={alt ?? ""}
                fill
                sizes="(max-width:760px) 28vw, 16vw"
              />
            </div>
          ))}
        </div>
        <div className="x-orbit-copy">
          <h2>
            The whole
            <br />
            <em>picture.</em>
          </h2>
          <p>
            A useful product is a meeting of people, ideas and decisions. We keep them
            in view together, from the first conversation to the smallest interaction.
          </p>
          <Link href="/approach" className="x-link">
            See how we work ↗
          </Link>
        </div>
      </section>
      <Archive projects={stories} />
      <MediaTakeover
        image="sculpture"
        alt="A sculptural concrete curve at Tate Modern"
        title="An idea deserves a world of its own."
        body="The story, the interface, the detail. Each one should feel like it belongs to the same idea."
      />
      <section className="x-journal-section" data-cover-scene>
        <div className="x-section-heading">
          <h2 data-reveal>
            The <InlinePhoto name="paper" /> thinking
            <br />
            becomes the thing.
          </h2>
          <p>
            Open the working journal.
            <br />
            This is how a project takes shape.
          </p>
        </div>
        <TurningBook pages={journal} label="The Valtum working journal" />
      </section>
      <section className="x-partnership" data-section-shift>
        <div className="x-partnership-photo">
          <Image
            src="/editorial/sydney.webp"
            alt="An aerial view across Sydney Harbour"
            fill
            sizes="(max-width:760px) 100vw, 50vw"
            data-parallax
          />
        </div>
        <div>
          <h2 data-reveal>
            Close to <InlinePhoto name="detail" /> the work.
            <br />
            Wherever you are.
          </h2>
          <p>
            A good partnership needs a shared understanding, not a shared postcode. We
            make room for direct conversations, visible progress and decisions you can
            follow.
          </p>
          <p>
            Tell us what you are trying to change. We will work through the right
            starting point with you.
          </p>
          <Link className="x-button" href="/contact">
            Start a conversation ↗
          </Link>
          {team.length > 0 && (
            <div className="v-real-team">
              {team.map((member) => (
                <p key={member.slug}>
                  {member.name} · {member.roleTitle}
                </p>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="x-questions">
        <h2 data-reveal>
          A few things
          <br />
          you may be wondering.
        </h2>
        <div>
          {[
            [
              "Where does a project start?",
              "With a conversation about the change you want to make, the people involved and what already exists. We agree on a useful next step before defining a larger engagement."
            ],
            [
              "Can you take an idea through design and development?",
              "Yes. Product thinking, experience design and engineering are connected parts of our practice. The scope is shaped around what the project needs, with responsibilities agreed from the beginning."
            ],
            [
              "Can you work with an existing product?",
              "We can begin with a focused review, a new customer journey, an integration or an improvement to the public experience. A useful change does not always need a complete rebuild."
            ],
            [
              "How do you put a price on the work?",
              "We define the scope, the decisions that need to be made and the delivery boundaries before quoting. That gives both sides a clearer understanding of the work and the investment."
            ]
          ].map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <Link className="x-link" href="/solutions">
          Explore solutions ↗
        </Link>
      </section>
    </main>
  );
}
