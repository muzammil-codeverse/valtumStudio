import Image from "next/image";

import { StudioHero } from "./StudioHero";

export function InlinePhoto({ name }: { name: string }): React.JSX.Element {
  return (
    <span className="m-inline-photo" aria-hidden="true">
      <Image src={`/editorial/${name}.webp`} alt="" fill sizes="140px" />
    </span>
  );
}

export function CinematicHero(): React.JSX.Element {
  return <StudioHero />;
}

export function MediaTakeover({
  image,
  alt,
  title,
  body
}: {
  image: string;
  alt: string;
  title: string;
  body: string;
}): React.JSX.Element {
  return (
    <section className="m-takeover" data-takeover>
      <div className="m-takeover-stage">
        <div className="m-takeover-media">
          <Image src={`/editorial/${image}.webp`} alt={alt} fill sizes="100vw" />
        </div>
        <div className="m-takeover-copy">
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
      </div>
    </section>
  );
}

export function PracticeReel(): React.JSX.Element {
  return (
    <div
      className="m-practice-reel"
      aria-label="Think clearly. Make carefully. Keep improving."
    >
      <div aria-hidden="true">
        Think clearly. <InlinePhoto name="sketch" /> Make carefully.{" "}
        <InlinePhoto name="spiral" /> Keep improving. <InlinePhoto name="detail" />{" "}
        Think clearly. <InlinePhoto name="sketch" /> Make carefully.
      </div>
    </div>
  );
}
