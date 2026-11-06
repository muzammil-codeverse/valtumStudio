import Image from "next/image";
import Link from "next/link";

const leadership = [
  {
    name: "Abdurrehman Khalid",
    role: "Founder & CEO",
    portrait: "/team/abdurrehman-khalid.webp",
    bio: "Leads the studio's direction and works closely with clients to turn the right business questions into better digital products."
  },
  {
    name: "Muzammil Hassan",
    role: "Chief Technology Officer",
    portrait: "https://res.cloudinary.com/z9nut7zm/image/upload/v1793929312/valtum-studio/team/muzammil-hassan-2026-11-06.jpg",
    bio: "Leads system architecture and software engineering, from the decisions that shape a product to the details that make it reliable."
  }
] as const;

export function StudioPeople(): React.JSX.Element {
  return (
    <section className="vp-people" id="team" aria-labelledby="vp-people-title">
      <div className="vp-people-inner">
        <div className="vp-people-intro" data-reveal>
          <h2 id="vp-people-title">
            The people behind
            <br />
            <span>Valtum Studio.</span>
          </h2>
          <p>
            We keep the people shaping a product close to the people building it. Clear
            conversations, considered decisions and care for what happens after launch.
          </p>
          <Link className="vp-people-cta" href="/contact">
            Let&apos;s talk <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="vp-people-stage" aria-label="Studio leadership">
          <svg
            className="vp-people-orbit"
            viewBox="0 0 760 580"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          >
            <path
              className="vp-orbit-path"
              d="M48 505 C36 372 225 345 354 232 S626 17 701 68 C785 124 659 330 492 443 S120 641 48 505"
            />
            <circle
              className="vp-orbit-dot vp-orbit-dot--first"
              cx="701"
              cy="68"
              r="3"
            />
            <circle
              className="vp-orbit-dot vp-orbit-dot--last"
              cx="48"
              cy="505"
              r="3"
            />
          </svg>
          {leadership.map((member, index) => (
            <details
              className={`vp-person vp-person--${index === 0 ? "founder" : "technical"}`}
              key={member.name}
              data-reveal
            >
              <summary aria-label={`Learn more about ${member.name}`}>
                <span className="vp-person-photo">
                  <Image
                    src={member.portrait}
                    alt={`Portrait of ${member.name}`}
                    fill
                    unoptimized={member.portrait.startsWith("https://res.cloudinary.com/")}
                    sizes="(max-width: 600px) 128px, (max-width: 1080px) 144px, 186px"
                  />
                </span>
                <span className="vp-person-plate">
                  <span className="vp-person-name">{member.name}</span>
                  <span className="vp-person-role">{member.role}</span>
                  <span className="vp-person-action" aria-hidden="true">
                    ↗
                  </span>
                </span>
              </summary>
              <p className="vp-person-bio">{member.bio}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
