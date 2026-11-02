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
import { StudioPeople } from "@/modules/public-site/studio/StudioPeople";

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
          engineering and creative technology meet. We take on complex digital problems,
          make the decisions clear and build with the people who will use what comes
          next.
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
      <StudioPeople />
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
