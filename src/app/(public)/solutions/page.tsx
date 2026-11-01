import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DevicePreview } from "@/modules/public-site/studio/DevicePreview";
import { InlinePhoto, MediaTakeover } from "@/modules/public-site/studio/SceneElements";
export const metadata: Metadata = {
  alternates: { canonical: "/solutions" },
  title: "Solutions | Valtum Studio",
  description:
    "A new product, a connected operation or a clearer decision. Software designed around the change your business needs."
};
const situations = [
  {
    id: "01",
    title: "Make the opportunity a product.",
    body: "There is a useful idea in the business. It might be a new service, a customer portal or a platform people would choose to come back to. We help you define the proposition, test the journey and build the product around it.",
    theme: "lodge",
    project: "Laugh & Lodge",
    slug: "laugh-and-lodge",
    service: "digital-products",
    steps: [
      "Define the opportunity",
      "Shape the journey",
      "Build the product",
      "Learn from use"
    ]
  },
  {
    id: "02",
    title: "Connect the work behind the experience.",
    body: "The customer sees one business. Behind the scenes, requests may move through several people, spreadsheets and systems. We follow that journey and give the handoffs a shared structure.",
    theme: "courier",
    project: "KT Couriers",
    slug: "kt-couriers",
    service: "connected-operations",
    steps: [
      "Follow the work",
      "Find the handoffs",
      "Connect the records",
      "Handle the exceptions"
    ]
  },
  {
    id: "03",
    title: "Turn information into a clearer decision.",
    body: "A pattern or prediction only becomes useful in context. We build the interfaces, evidence trails and review steps that help people understand what a system is suggesting and decide what to do next.",
    theme: "aegis",
    project: "Aegis Sentinel",
    slug: "aegis-sentinel",
    service: "intelligent-systems",
    steps: [
      "Establish the source",
      "Define the task",
      "Evaluate the result",
      "Support the decision"
    ]
  },
  {
    id: "04",
    title: "Make the public experience feel like you.",
    body: "Your business has a character. Your website should make it clear. We connect the story, the imagery and the interaction so visitors understand what you do and why it is worth a conversation.",
    theme: "math",
    project: "Math Intellect",
    slug: "math-intellect",
    service: "websites-and-experiences",
    steps: [
      "Find the story",
      "Direct the experience",
      "Build the detail",
      "Refine for every screen"
    ]
  }
];
export default function SolutionsPage(): React.JSX.Element {
  return (
    <main className="x-solutions" id="main-content">
      <header className="m-solutions-opening">
        <h1>
          What if
          <br />
          <em>
            it worked <InlinePhoto name="sculpture" /> differently?
          </em>
        </h1>
        <div className="m-solutions-lede">
          <p>
            A better customer journey. A calmer operation. A decision you can explain.
            Start with the change you want to make.
          </p>
          <a className="x-link" href="#solution-01">
            Find your starting point ↓
          </a>
        </div>
        <div className="m-solutions-strip" aria-hidden="true">
          {["architecture", "detail", "spiral", "sketch"].map((name) => (
            <div key={name}>
              <Image src={`/editorial/${name}.webp`} alt="" fill sizes="30vw" />
            </div>
          ))}
        </div>
      </header>
      <section className="m-solution-intro" data-cover-scene>
        <h2>
          There is a business
          <br />
          behind every <InlinePhoto name="collaboration" /> brief.
        </h2>
        <p>
          We look at the people, the handoffs and the decisions before choosing what to
          build. The software earns its place by making that experience better.
        </p>
      </section>
      {situations.map((item) => (
        <section
          className="x-solution m-solution-dossier"
          id={`solution-${item.id}`}
          key={item.id}
          data-dossier
        >
          <div className="m-solution-visual" data-curtain-image>
            <Image
              src={`/editorial/${["sculpture", "architecture", "detail", "spiral"][Number(item.id) - 1]}.webp`}
              alt="An editorial study of structure and connection"
              fill
              sizes="(max-width:760px) 100vw, 45vw"
            />
          </div>
          <div className="x-solution-copy">
            <h2 data-reveal>{item.title}</h2>
            <p>{item.body}</p>
            <Link className="x-link" href={`/services/${item.service}`}>
              Explore the service ↗
            </Link>
          </div>
          <div className="x-solution-proof">
            <DevicePreview theme={item.theme} title={item.project} />
            <Link className="x-link" href={`/work/${item.slug}`}>
              Inside {item.project} ↗
            </Link>
          </div>
          <ol>
            {item.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ))}
      <MediaTakeover
        image="sydney"
        alt="Sydney Harbour seen from above"
        title="Make room for what comes next."
        body="Bring the problem, the ambition or the question. We will help you find the work worth doing."
      />
      <section className="x-service-end" data-cover-scene>
        <h2 data-word-reveal>
          Tell us about
          <br />
          your next move.
        </h2>
        <Link href="/contact" className="x-button">
          Start the conversation ↗
        </Link>
      </section>
    </main>
  );
}
