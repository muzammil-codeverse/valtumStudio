import { describe, expect, it } from "vitest";

import { summarizeDelivery } from "./delivery-insights";

describe("delivery insight summaries", () => {
  const project = { id: "eng-1", title: "Product A", status: "ACTIVE" };
  const engagement = { id: project.id, title: project.title };
  it("never invents progress when no work is assigned", () => {
    const result = summarizeDelivery(
      { engagements: [project], tasks: [], milestones: [] },
      new Date("2026-11-02T00:00:00Z")
    );
    expect(result.active).toBe(1);
    expect(result.taskPercent).toBeNull();
    expect(result.milestonePercent).toBeNull();
    expect(result.upcoming).toHaveLength(0);
    expect(result.months).toHaveLength(6);
  });
  it("computes factual task rates and excludes completed work from upcoming", () => {
    const result = summarizeDelivery(
      {
        engagements: [project],
        tasks: [
          {
            id: "1",
            title: "Complete",
            status: "DONE",
            dueDate: new Date("2026-11-03T00:00:00Z"),
            engagement
          },
          {
            id: "2",
            title: "Pending",
            status: "IN_PROGRESS",
            dueDate: new Date("2026-11-04T00:00:00Z"),
            engagement
          },
          { id: "3", title: "Blocked", status: "BLOCKED", dueDate: null, engagement }
        ],
        milestones: [
          {
            id: "4",
            title: "Signed",
            status: "APPROVED",
            dueDate: new Date("2026-11-03T00:00:00Z"),
            engagement
          }
        ]
      },
      new Date("2026-11-02T00:00:00Z")
    );
    expect(result.taskPercent).toBe(33);
    expect(result.blocked).toBe(1);
    expect(result.milestonePercent).toBe(100);
    expect(result.upcoming.map((item) => item.id)).toEqual(["2"]);
    expect(result.projects[0]?.percent).toBe(33);
  });
  it("filters overdue and distant deadlines from the next 30 days", () => {
    const dates = ["2026-10-31", "2026-11-15", "2026-12-05"];
    const tasks = dates.map((day, i) => ({
      id: String(i),
      title: day,
      status: "OPEN",
      dueDate: new Date(day + "T12:00:00Z"),
      engagement
    }));
    const result = summarizeDelivery(
      { engagements: [project], tasks, milestones: [] },
      new Date("2026-11-02T00:00:00Z")
    );
    expect(result.upcoming.map((item) => item.title)).toEqual(["2026-11-15"]);
  });
});
