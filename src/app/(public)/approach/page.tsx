import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { approach } from "@/modules/public-site/studio/content";
import { studioJournal } from "@/modules/public-site/studio/journal";
import {
  InlinePhoto,
  MediaTakeover,
  PracticeReel
} from "@/modules/public-site/studio/SceneElements";
import { TurningBook } from "@/modules/public-site/studio/TurningBook";
export const metadata: Metadata = {
  alternates: { canonical: "/approach" },
  title: "Approach | Valtum Studio",
  description:
    "A clear brief, visible decisions and working software. Inside the Valtum Studio approach."
};
export default function ApproachPage(): React.JSX.Element {
  return (
    <main className="x-approach-page" id="main-content">
      <header className="m-approach-opening">
        <div className="m-approach-photo" data-curtain-image>
          <Image
            src="/editorial/paper.webp"
            alt="Drawing and planning tools around a working notebook"
            fill
            priority
            sizes="(max-width:760px) 100vw, 55vw"
          />
        </div>
        <div>
          <h1>
            Room to think.
            <br />
            <em>A way to move.</em>
          </h1>
          <p>
            The process should make the work clearer. We ask the difficult questions
            early, make decisions visible and keep building towards something people can
            use.
          </p>
          <a className="x-link" href="#working-method">
            Inside our working method ↓
          </a>
        </div>
      </header>
      <section className="m-method" id="working-method">
        <div className="m-method-heading">
          <h2>
            Progress you
            <br />
            can <InlinePhoto name="detail" /> follow.
          </h2>
          <p>
            A project changes as you learn. The point of a method is to give that
            learning somewhere useful to go.
          </p>
        </div>
        <div className="m-method-chapters">
          {approach.map((stage, i) => (
            <article key={stage.name}>
              <div className="m-method-image" data-curtain-image>
                <Image
                  src={`/editorial/${["detail", "sketch", "architecture", "sculpture"][i % 4]}.webp`}
                  alt="An editorial study of the creative process"
                  fill
                  sizes="(max-width:760px) 90vw, 45vw"
                />
              </div>
              <h2 data-reveal>{stage.title}</h2>
              <p>{stage.text}</p>
              <strong>{stage.output}</strong>
            </article>
          ))}
        </div>
      </section>
      <PracticeReel />
      <section className="x-journal-section">
        <div className="x-section-heading">
          <h2 data-reveal>
            From a conversation
            <br />
            to something concrete.
          </h2>
          <p>
            Turn through the working journal.
            <br />
            Each chapter has a useful outcome.
          </p>
        </div>
        <TurningBook pages={studioJournal} />
      </section>
      <MediaTakeover
        image="spiral"
        alt="A staircase turning around a curved architectural wall"
        title="A clear direction. Room to discover."
        body="The route may evolve. The purpose stays in view, from the first prototype to the final handover."
      />
      <section className="x-service-end" data-cover-scene>
        <h2 data-word-reveal>
          The first step
          <br />
          should feel clear.
        </h2>
        <p>
          Tell us where you are, what you want to change and what is making it
          difficult. We will help define a useful place to begin.
        </p>
        <Link className="x-button" href="/contact">
          Let’s find the starting point ↗
        </Link>
      </section>
    </main>
  );
}
