import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  InlinePhoto,
  MediaTakeover,
  PracticeReel
} from "@/modules/public-site/studio/SceneElements";
import { pageSeo, publicPageMetadata } from "@/modules/public-site/studio/seo";

export const metadata: Metadata = publicPageMetadata(pageSeo.studio, "/studio");
export default function StudioPage(): React.JSX.Element {
  return (
    <main className="x-studio-page" id="main-content">
      <header className="x-editorial-heading">
        <h1>
          A studio for
          <br />
          <em>what comes next.</em>
        </h1>
        <p>
          Valtum Studio is an Australian-registered software and digital product studio
          founded in 2026 by Abdur Rehman Khalid. We build custom applications, SaaS
          platforms, connected business systems and distinctive digital experiences
          for teams in Australia and internationally.
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
            <a href="mailto:hello@valtumstudio.com.au">
              hello@valtumstudio.com.au
            </a>
            .
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
