import Image from "next/image";
import Link from "next/link";

const leadership = [
  {
    name: "Abdurrehman Khalid",
    role: "Founder & CEO",
    image: "/team/abdurrehman-khalid.webp",
    width: 460,
    height: 586,
    description:
      "Shapes the studio's direction, product thinking and conversations with the businesses we build for.",
    className: "x-leadership-portrait--founder",
    contact: "https://www.linkedin.com/in/abdurrehmankhalid/"
  },
  {
    name: "Muzammil Hassan",
    role: "Chief Technology Officer",
    image: "/team/muzammil-hassan.webp",
    width: 460,
    height: 523,
    description:
      "Leads technical direction, software architecture and the engineering decisions behind our work.",
    className: "x-leadership-portrait--cto",
    contact: null
  }
] as const;

export function LeadershipSection(): React.JSX.Element {
  return (
    <section className="x-leadership" aria-labelledby="x-leadership-title">
      <div className="x-leadership-heading">
        <div>
          <p className="x-leadership-index">THE PEOPLE BEHIND VALTUM / 01—02</p>
          <h2 id="x-leadership-title" data-word-reveal>
            Two perspectives.
            <br />
            <em>One commitment to the work.</em>
          </h2>
        </div>
        <p className="x-leadership-intro">
          Good digital products need a clear direction and thoughtful engineering.
          Meet the people responsible for both at Valtum Studio.
        </p>
      </div>
      <div className="x-leadership-grid">
        {leadership.map((person, index) => (
          <article className="x-leadership-person" key={person.name} data-reveal>
            <div className={`x-leadership-portrait ${person.className}`}>
              <Image
                src={person.image}
                alt={`Portrait of ${person.name}, ${person.role} at Valtum Studio`}
                width={person.width}
                height={person.height}
                sizes="(max-width: 720px) 92vw, (max-width: 1100px) 45vw, 39vw"
              />
              <span aria-hidden="true" className="x-leadership-number">
                0{index + 1}
              </span>
            </div>
            <div className="x-leadership-caption">
              <div className="x-leadership-identity">
                <h3>{person.name}</h3>
                <span>{person.role}</span>
              </div>
              <p>{person.description}</p>
            </div>
            {person.contact && (
              <Link
                href={person.contact}
                target="_blank"
                rel="noopener noreferrer"
                className="x-leadership-link"
              >
                Connect with the founder <span aria-hidden="true">↗</span>
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
