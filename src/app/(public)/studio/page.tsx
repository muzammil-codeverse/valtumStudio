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
import { LeadershipSection } from "@/modules/public-site/studio/LeadershipSection";

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
          Valtum Studio is an Australian-registered software and digital product studio
          founded in 2026 by Abdurrehman Khalid. We build custom applications, SaaS
          platforms, connected business systems and distinctive digital experiences for
          teams in Australia and internationally.
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
      <section className="x-studio-view" data-cover-scene>
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
          <p>
            Our business name is registered in Australia. You can verify the public
            record through the{" "}
            <a
              href="https://abr.business.gov.au/ABN/View?id=24207947663"
              rel="noopener noreferrer"
              target="_blank"
            >
              Australian Business Register
            </a>
            . For enquiries, email{" "}
            <a href="mailto:hello@valtumstudio.com.au">hello@valtumstudio.com.au</a>.
            Meet the founder on{" "}
            <a
              href="https://www.linkedin.com/in/abdurrehmankhalid/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>
      </section>
      <section className="x-leadership" aria-labelledby="leadership-heading">
        <div className="x-leadership-intro" data-reveal>
          <div className="x-leadership-rule">
            <span>THE PEOPLE BEHIND VALTUM</span>
            <span>01 / 02</span>
          </div>
          <h2 id="leadership-heading">
            People make
            <br />
            <em>the difference.</em>
          </h2>
          <p>
            Your project shouldn't disappear into a hand-off. Our direction and
            engineering leads stay close to the decisions, the details and the people
            using what we build.
          </p>
        </div>
        <div className="x-leadership-grid">
          <article className="x-leader" data-reveal>
            <div className="x-leader-portrait x-leader-portrait--founder">
              <div className="x-leader-photo">
                <Image
                  src="/team/abdurrehman-portrait.webp"
                  alt="Portrait of Abdurrehman Khalid, founder and CEO of Valtum Studio"
                  fill
                  sizes="(max-width: 700px) 78vw, (max-width: 1100px) 38vw, 370px"
                />
              </div>
              <span className="x-leader-number" aria-hidden="true">01</span>
            </div>
            <div className="x-leader-caption">
              <span className="x-leader-discipline">Direction &amp; partnerships</span>
              <h3>Abdurrehman Khalid</h3>
              <p className="x-leader-role">Founder &amp; CEO</p>
              <p className="x-leader-bio">
                Leads the studio's direction and client relationships, keeping
                technology decisions connected to the business problems they solve.
              </p>
              <a
                className="x-leader-link"
                href="https://www.linkedin.com/in/abdurrehmankhalid/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Connect with Abdurrehman <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
          <article className="x-leader x-leader--technology" data-reveal>
            <div className="x-leader-portrait x-leader-portrait--cto">
              <div className="x-leader-photo">
                <Image
                  src="/team/muzammil-portrait.webp"
                  alt="Portrait of Muzammil Hassan, chief technology officer of Valtum Studio"
                  fill
                  sizes="(max-width: 700px) 78vw, (max-width: 1100px) 38vw, 370px"
                />
              </div>
              <span className="x-leader-number" aria-hidden="true">02</span>
            </div>
            <div className="x-leader-caption">
              <span className="x-leader-discipline">Architecture &amp; engineering</span>
              <h3>Muzammil Hassan</h3>
              <p className="x-leader-role">Chief Technology Officer</p>
              <p className="x-leader-bio">
                Leads technical architecture and engineering delivery, bringing
                software systems, data and the interface together as a coherent product.
              </p>
            </div>
          </article>
        </div>
      </section>
      <LeadershipSection />
      <PracticeReel />
      <MediaTakeover
        image="sculpture"
        alt="A sculptural curve of concrete and shadow"
        title="An independent point of view."
        body="The character of a business deserves more than a familiar formula. We look for the idea that gives the whole experience its shape."
      />
      <section className="x-studio-principles" data-cover-scene>
        {[
          [
            "A point of view.",
            "Good work has a reason behind it. We help find the character of the product and carry it through the details."
          ],
          [
            "Room to question.",
            "The first answer is not always the useful one. We test assumptions and make important choices visible while they can still be changed."
          ],
          [
            "Care that follows through.",
            "The interface, the exception and the handover all belong to the work. Finishing well means thinking about the people who use it next."
          ]
        ].map(([title, body]) => (
          <article data-stack key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
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
                Leads the studio’s direction and client relationships, bringing
                business questions and product decisions into the same conversation.
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
                Guides technical architecture and engineering delivery, with
                attention to the decisions that make software reliable and useful.
              </p>
            </div>
          </article>
        </div>
        <div className="x-leadership-bottom">
          <span>Small by design. Close to the work.</span>
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
