"use client";

import { useEffect, useMemo, useState } from "react";

import { meanRevertingSeries } from "./experiments";
import { TurningBook } from "./TurningBook";

const recordPages = [
  {
    title: "The source stays.",
    label: "01 / Observation",
    body: "The original capture remains the point of reference. Every later interpretation points back to this record.",
    detail: "Source → Retained artifact"
  },
  {
    title: "The interpretation can change.",
    label: "02 / Review",
    body: "A model suggests. A person examines. The review adds context without rewriting the material that made it possible.",
    detail: "Inference → Human review"
  },
  {
    title: "The history stays readable.",
    label: "03 / Integrity",
    body: "Custody events and integrity checks give the artifact a history that can be examined alongside its contents.",
    detail: "Artifact → Evidence history"
  }
] as const;

function EvidenceBook(): React.JSX.Element {
  const pages = recordPages.map((item, i) => ({
    title: item.title,
    body: item.body,
    image: i === 1 ? "/editorial/detail.webp" : "/products/aegis.webp",
    alt:
      i === 1
        ? "A person reviewing information on a laptop"
        : "The actual Aegis Sentinel public website",
    note: item.detail
  }));
  return (
    <section className="x-evidence-book">
      <div className="x-section-heading">
        <h2 data-reveal>
          Keep the source.
          <br />
          Turn the page.
        </h2>
        <p>
          An observation gains a history.
          <br />
          Explore the illustrative evidence journal.
        </p>
      </div>
      <TurningBook pages={pages} label="Aegis evidence journal" />
    </section>
  );
}

function Reservation(): React.JSX.Element {
  const [status, setStatus] = useState<"available" | "held" | "confirmed" | "expired">(
    "available"
  );
  const [expiry, setExpiry] = useState(0);
  const [remaining, setRemaining] = useState(900);
  useEffect(() => {
    if (status !== "held") return;
    function tick(): void {
      const left = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) setStatus("expired");
    }
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [status, expiry]);
  function hold(): void {
    setRemaining(900);
    setExpiry(Date.now() + 900000);
    setStatus("held");
  }
  return (
    <section className="v-experience v-reservation">
      <div className="v-experience-heading">
        <h2>
          Time to
          <br />
          <em>make it yours.</em>
        </h2>
        <p>
          Try the handoff from availability to a confirmed reservation. This local
          demonstration makes no booking or payment.
        </p>
      </div>
      <div className="v-reservation-record">
        <div className="v-reservation-dates">
          <div>
            <span>ARRIVE</span>
            <strong>08</strong>
            <span>November</span>
          </div>
          <span aria-hidden="true">→</span>
          <div>
            <span>DEPART</span>
            <strong>10</strong>
            <span>November</span>
          </div>
        </div>
        <div aria-live="polite" className={`v-reservation-state v-state-${status}`}>
          <span className="v-dot" />
          <p>
            {status === "available"
              ? "Your dates are available"
              : status === "held"
                ? `Held for ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                : status === "confirmed"
                  ? "Reservation confirmed"
                  : "Hold expired. Dates released."}
          </p>
        </div>
        {status === "available" || status === "expired" ? (
          <button className="v-demo-button" onClick={hold}>
            Place a temporary hold <span>↗</span>
          </button>
        ) : status === "held" ? (
          <button className="v-demo-button" onClick={() => setStatus("confirmed")}>
            Receive simulated payment event <span>↗</span>
          </button>
        ) : (
          <button className="v-demo-button" onClick={() => setStatus("available")}>
            Explore the reservation again <span>↻</span>
          </button>
        )}
        <p className="v-proof-note">
          {status === "confirmed"
            ? "The simulated authoritative event confirms the held dates."
            : "A hold protects inventory. It does not confirm payment."}
        </p>
      </div>
    </section>
  );
}

const handoffs = [
  {
    role: "Merchant",
    action: "Ready for collection.",
    text: "The order is prepared. Its inventory and fulfilment requirements travel with it.",
    mark: "PREPARED"
  },
  {
    role: "Dispatcher",
    action: "The next move has an owner.",
    text: "An eligible driver is assigned. Responsibility moves through an explicit allocation step.",
    mark: "ALLOCATED"
  },
  {
    role: "Driver",
    action: "Custody changes hands.",
    text: "Collection connects the physical parcel to the person responsible for moving it.",
    mark: "COLLECTED"
  },
  {
    role: "Recipient",
    action: "The handoff becomes a record.",
    text: "Delivery evidence closes the physical journey. Reconciliation can follow its own financial trail.",
    mark: "DELIVERED"
  }
] as const;
function Handoff(): React.JSX.Element {
  const [stage, setStage] = useState(0);
  const active = handoffs[stage] ?? handoffs[0];
  return (
    <section className="v-experience v-handoff">
      <div className="v-experience-heading">
        <h2>
          Same order.
          <br />
          <em>Different hands.</em>
        </h2>
      </div>
      <div className="v-parcel">
        <div className="v-parcel-label">
          <div className="v-barcode" aria-hidden="true" />
          <strong>DEMO / 001</strong>
          <div className="v-parcel-stamp" key={stage}>
            {active.mark}
          </div>
          <p>{active.action}</p>
        </div>
      </div>
      <div className="v-handoff-detail">
        <div className="v-role-buttons" aria-label="Delivery perspectives">
          {handoffs.map((item, i) => (
            <button
              aria-pressed={stage === i}
              key={item.role}
              onClick={() => setStage(i)}
            >
              {item.role}
            </button>
          ))}
        </div>
        <p aria-live="polite">{active.text}</p>
      </div>
    </section>
  );
}

function Assumption(): React.JSX.Element {
  const [persistence, setPersistence] = useState(0.65);
  const values = useMemo(() => meanRevertingSeries(persistence), [persistence]);
  const path = values
    .map((value, i) => `${i === 0 ? "M" : "L"}${20 + i * 10} ${160 - value * 32}`)
    .join(" ");
  return (
    <section className="v-experience v-assumption">
      <div className="v-experience-heading">
        <h2>
          How long does
          <br />a change <em>stay?</em>
        </h2>
        <p>
          Move the persistence parameter. The same sequence of disturbances is used each
          time, so the effect of the assumption stays visible.
        </p>
      </div>
      <div className="v-experiment">
        <div className="v-experiment-head">
          <output htmlFor="persistence">φ = {persistence.toFixed(2)}</output>
        </div>
        <svg
          aria-label="A seeded mean reverting series with 61 observations"
          role="img"
          viewBox="0 0 640 320"
        >
          <path
            d="M20 80H620 M20 160H620 M20 240H620"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".15"
          />
          <path
            className="v-calculated-path"
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <text x="20" y="306">
            0
          </text>
          <text x="595" y="306">
            60
          </text>
        </svg>
        <label htmlFor="persistence">
          Persistence <span>Lower memory → Longer memory</span>
        </label>
        <input
          id="persistence"
          max="0.95"
          min="0.1"
          onChange={(event) => setPersistence(Number(event.target.value))}
          step="0.05"
          type="range"
          value={persistence}
        />
        <p className="v-proof-note">
          Fixed seed. Illustrative AR(1) calculation. Separate from the authenticated
          geometric Brownian motion engine.
        </p>
      </div>
    </section>
  );
}

const evidence = [
  {
    name: "Source",
    title: "The answer remains visible.",
    text: "I enjoy finding patterns in complicated information, then explaining what I notice.",
    footer: "Illustrative response. No personal data is collected."
  },
  {
    name: "Contributions",
    title: "One response. Several possible signals.",
    text: "Analytical interests. Curiosity. Communication. A response can contribute to more than one evidence dimension.",
    footer: "Illustrative relationships, not a scored assessment."
  },
  {
    name: "Interpretation",
    title: "An explanation beside the evidence.",
    text: "Structured scoring and confidence establish the record. Optional narrative helps explain it, while the source remains available to examine.",
    footer: "Guidance for reflection. No clinical or employment decision."
  }
] as const;
function LivingRecord(): React.JSX.Element {
  const [layer, setLayer] = useState(0);
  const active = evidence[layer] ?? evidence[0];
  return (
    <section className="v-experience v-living-record">
      <div className="v-experience-heading">
        <h2>
          More context.
          <br />
          <em>The same person.</em>
        </h2>
      </div>
      <div className="v-record-stack">
        <div className="v-record-paper" key={layer}>
          <h3>{active.title}</h3>
          <p aria-live="polite">{active.text}</p>
          <small>{active.footer}</small>
        </div>
      </div>
      <div className="v-record-controls" aria-label="Evidence layers">
        {evidence.map((item, i) => (
          <button
            aria-pressed={layer === i}
            key={item.name}
            onClick={() => setLayer(i)}
          >
            {item.name}
          </button>
        ))}
      </div>
    </section>
  );
}

export function StoryExperience({ theme }: { theme: string }): React.JSX.Element {
  if (theme === "aegis") return <EvidenceBook />;
  if (theme === "lodge") return <Reservation />;
  if (theme === "courier") return <Handoff />;
  if (theme === "math") return <Assumption />;
  return <LivingRecord />;
}
