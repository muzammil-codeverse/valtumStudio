"use client";

import { useState } from "react";

import styles from "./home.module.css";

type Capability = Readonly<{ title: string; description: string }>;
type CapabilitiesSectionProperties = Readonly<{
  capabilities: ReadonlyArray<Capability>;
}>;

export function CapabilitiesSection({
  capabilities
}: CapabilitiesSectionProperties): React.JSX.Element | null {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = capabilities[activeIndex] ?? capabilities[0];
  if (!active) return null;

  return (
    <section
      aria-labelledby="capabilities-heading"
      className={`${styles.section} ${styles.capabilities}`}
      id="capabilities"
    >
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <p className={styles.label}>Capabilities</p>
          <h2 className={styles.sectionTitle} id="capabilities-heading">
            What we engineer
          </h2>
        </div>
        <div className={styles.capabilityLayout}>
          <div
            className={styles.capabilityList}
            role="tablist"
            aria-label="Capabilities"
          >
            {capabilities.map((capability, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  aria-controls="capability-panel"
                  aria-selected={isActive}
                  className={styles.capabilityButton}
                  id={`capability-tab-${index + 1}`}
                  key={capability.title}
                  onClick={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  role="tab"
                  type="button"
                >
                  <span className={styles.projectNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.capabilityName}>{capability.title}</span>
                </button>
              );
            })}
          </div>
          <div
            aria-labelledby={`capability-tab-${activeIndex + 1}`}
            className={styles.capabilityPanel}
            id="capability-panel"
            role="tabpanel"
          >
            <span>Systems with purpose</span>
            <p>{active.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
