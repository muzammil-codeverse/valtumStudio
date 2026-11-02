import Link from "next/link";

import {
  type LeadDemandItem,
  summarizeLeadOutcomes
} from "@/modules/admin/domain/lead-demand";
import type { DashboardInsight } from "@/modules/admin/server/overview-insights";

export function DemandAndOutcomes({
  demand,
  insight
}: Readonly<{
  demand: readonly LeadDemandItem[];
  insight: DashboardInsight;
}>): React.JSX.Element {
  const max = Math.max(1, ...demand.map((item) => item.count));
  const outcomes = summarizeLeadOutcomes(insight.pipeline);
  return (
    <div className="ds-demand-layout">
      <section className="ds-panel ds-demand-panel" aria-labelledby="lead-demand-title">
        <div className="ds-block-heading">
          <div>
            <h2 id="lead-demand-title">What clients are asking for</h2>
            <p>
              Enquiries grouped by requested project type, not estimated market demand.
            </p>
          </div>
          <Link className="ds-inline-link" href="/admin/leads">
            View enquiries ↗
          </Link>
        </div>
        {demand.length === 0 ? (
          <p className="ds-footnote">
            Project categories will appear when real enquiries are recorded.
          </p>
        ) : (
          <div className="ds-demand-rows">
            {demand.slice(0, 9).map((item) => (
              <div className="ds-demand-row" key={item.key}>
                <div className="ds-demand-row-label">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
                <div
                  className="ds-demand-track"
                  aria-label={item.label + ": " + item.count + " enquiries"}
                  role="img"
                >
                  <span style={{ width: (item.count / max) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="ds-panel ds-outcome-panel" aria-labelledby="outcome-title">
        <div className="ds-block-heading">
          <div>
            <h2 id="outcome-title">Recorded outcomes</h2>
            <p>Won and lost enquiries with an explicit denominator.</p>
          </div>
        </div>
        <div className="ds-outcome-body">
          <div
            className="ds-outcome-ring"
            style={{
              background:
                outcomes.decided === 0
                  ? "conic-gradient(#e4e4ed 0 100%)"
                  : "conic-gradient(#5147be 0 " +
                    outcomes.percent +
                    "%, #e2e0ed " +
                    outcomes.percent +
                    "% 100%)"
            }}
            role="img"
            aria-label={
              outcomes.percent === null
                ? "No decided enquiries yet"
                : outcomes.percent + " percent of decided enquiries marked won"
            }
          >
            <div>
              <strong>
                {outcomes.percent === null ? "—" : outcomes.percent + "%"}
              </strong>
              <span>Marked won</span>
            </div>
          </div>
          <div className="ds-outcome-key">
            <div>
              <span>Won</span>
              <strong>{outcomes.won}</strong>
            </div>
            <div>
              <span>Lost</span>
              <strong>{outcomes.lost}</strong>
            </div>
            <div>
              <span>Decided enquiries</span>
              <strong>{outcomes.decided}</strong>
            </div>
          </div>
        </div>
        <p className="ds-footnote">
          This is a status ratio, not a revenue figure or a predictive win rate.
        </p>
      </section>
    </div>
  );
}
