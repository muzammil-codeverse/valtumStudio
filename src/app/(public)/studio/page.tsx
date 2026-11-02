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

export const metadata: Metadata = publicPageMetadata(pageSeo.studio, "/studio");
export default function StudioPage(): React.JSX.Element {
  return (
    <main className="x-studio-page" id="main-content">
      <SeoBreadcrumb title="Studio" path="/studio" />
      <header className="x-editorial-heading">
        <h1>
          A studio for
          <br />
          <em>what comes next.</em>
        </h1>
        <p>
          An independent Australian software studio working where product thinking,
          engineering and creative technology meet. We take on complex digital
          problems, make the decisions clear and build with the people who will use
          what comes next.
        </p>
      </header>
      <div className="x-studio-collage">
        <div>
          <Image
            src="/editorial/architecture.webp"
            alt="A person moving through a carefully designed architectural space"
            fill
            priority
            sizes="60vw"
            data-parallax
          />
        </div>
        <div>
          <Image
            src="/editorial/detail.webp"
            alt="People considering an interface together"
            fill
            sizes="40vw"
          />
        </div>
        <Image
          className="x-studio-seal"
          src="/branding/valtum-symbol-black.svg"
          alt="Valtum Studio symbol"
          width={100}
          height={100}
        />
      </div>
      <section className="x-studio-view">
        <h2 data-word-reveal>
          The <InlinePhoto name="sketch" /> creative work.
          <br />
          The technical <InlinePhoto name="detail" /> work.
          <br />
          The same conversation.
        </h2>
        <div>
          <p>
            A product is rarely only a design problem or an engineering problem. It is a
            question about people, business and the way things should work.
          </p>
          <p>
            We bring those perspectives together. The aim is to make the experience more
            distinctive, the decisions more understandable and the software more useful.
          </p>
          <p>
            You should know why a decision was made, where the work stands and what
            happens next. We keep those conversations close, wherever you are in the
            world.
          </p>

        </div>
      </section>
      <PracticeReel />
      <MediaTakeover
        image="sculpture"
        alt="A sculptural curve of concrete and shadow"
        title="An independent point of view."
        body="The character of a business deserves more than a familiar formula. We look for the idea that gives the whole experience its shape."
      />
      <section
        className="x-studio-principles x-studio-principles--reframed"
        aria-labelledby="studio-principles-title"
      >
        <div className="x-principles-heading">
          <h2 id="studio-principles-title">
            Good ideas deserve
            <br />
            <em>better questions.</em>
          </h2>
          <p>
            We bring design and engineering into the same room, where the important
            decisions can be made clearly and the work can stand up to real use.
          </p>
        </div>
        <div className="x-principles-list">
          {[
            {
              number: "01",
              title: "A point of view.",
              body: "Find the idea that gives the product its character, then carry it through every important detail."
            },
            {
              number: "02",
              title: "Room to question.",
              body: "Surface constraints early. Test assumptions. Keep decisions open while there is still time to make a better one."
            },
            {
              number: "03",
              title: "Care that follows through.",
              body: "The exceptional case, the handover and the person using it next matter just as much as the first impression."
            }
          ].map(({ number, title, body }) => (
            <article className="x-principle-row" data-reveal key={number}>
              <span className="x-principle-number" aria-hidden="true">
                {number}
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="x-leadership" id="team" aria-labelledby="leadership-title">
        <div className="x-leadership-heading" data-reveal>
          <div>
            <span className="x-leadership-index">Valtum Studio / Leadership</span>
            <h2 id="leadership-title">
              The people
              <br />
              <em>behind the work.</em>
            </h2>
          </div>
          <p>
            A close collaboration between product direction and engineering. Two
            perspectives, one responsibility: to build things that stand up to use.
          </p>
        </div>
        <div className="x-leadership-grid">
          <article className="x-person" data-reveal>
            <div className="x-person-image">
              <Image
                src="/team/abdurrehman-khalid.webp"
                alt="Portrait of Abdurrehman Khalid, founder and CEO of Valtum Studio"
                fill
                sizes="(max-width: 760px) 86vw, 42vw"
              />
              <span className="x-person-number" aria-hidden="true">
                01
              </span>
            </div>
            <div className="x-person-details">
              <div>
                <h3>Abdurrehman Khalid</h3>
                <p className="x-person-role">Founder &amp; CEO</p>
              </div>
              <p className="x-person-bio">
                Shapes the studio’s direction and works directly with clients to
                turn commercial questions into practical product decisions.
              </p>
            </div>
          </article>
          <article className="x-person x-person--offset" data-reveal>
            <div className="x-person-image">
              <Image
                src="/team/muzammil-hassan.webp"
                alt="Portrait of Muzammil Hassan, CTO of Valtum Studio"
                fill
                sizes="(max-width: 760px) 86vw, 42vw"
              />
              <span className="x-person-number" aria-hidden="true">
                02
              </span>
            </div>
            <div className="x-person-details">
              <div>
                <h3>Muzammil Hassan</h3>
                <p className="x-person-role">Chief Technology Officer</p>
              </div>
              <p className="x-person-bio">
                Leads engineering decisions from system design through delivery,
                with care for reliability, integrations and the people using the work.
              </p>
            </div>
          </article>
        </div>
        <div className="x-leadership-bottom">
          <span>Small by design. Directly accountable to the work.</span>
          <Link href="/contact">
            Start a conversation <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="x-studio-place">
        <Image
          src="/editorial/sydney.webp"
          alt="Sydney Harbour seen from above"
          fill
          sizes="100vw"
        />
        <div>
          <h2>
            Australian roots.
            <br />A wider conversation.
          </h2>
          <p>
            We collaborate with founders and teams across borders. The work begins with
            a shared ambition and grows through direct, thoughtful exchange.
          </p>
          <Link className="x-button" href="/contact">
            Introduce your idea ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
