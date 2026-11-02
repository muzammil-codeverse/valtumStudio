import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ScheduleBoard, type ScheduleItem } from "./ScheduleBoard";

const items: ScheduleItem[] = [
  {
    id: "m1",
    date: "2026-10-31",
    title: "Design handoff",
    context: "Client A · Milestone",
    kind: "milestone",
    href: "/portal/projects/a"
  },
  {
    id: "t1",
    date: "2026-11-01",
    title: "Engineering review",
    context: "Client A · Task",
    kind: "task",
    href: "/portal/projects/a"
  },
  {
    id: "t2",
    date: "2026-11-15",
    title: "Later checkpoint",
    context: "Client A · Task",
    kind: "task",
    href: "/portal/projects/a"
  }
];

afterEach(cleanup);

describe("ScheduleBoard", () => {
  it("shows events across the month boundary in the selected week", () => {
    render(
      <ScheduleBoard
        month="2026-10"
        selectedDate="2026-10-31"
        path="/portal/calendar"
        items={items}
        view="week"
      />
    );
    expect(screen.getAllByText("Design handoff")).toHaveLength(2);
    expect(screen.getAllByText("Engineering review")).toHaveLength(2);
    expect(screen.queryByText("Later checkpoint")).toBeNull();
    const next = screen.getByRole("link", { name: "Next week" });
    expect(next.getAttribute("href")).toContain("month=2026-11");
    expect(next.getAttribute("href")).toContain("date=2026-11-07");
  });

  it("limits the month view to the selected month and includes overflow events", () => {
    render(
      <ScheduleBoard
        month="2026-11"
        path="/portal/calendar"
        items={items}
        view="month"
      />
    );
    expect(screen.getAllByText("Engineering review").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Later checkpoint").length).toBeGreaterThan(0);
    expect(screen.queryByText("Design handoff")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Next month" }).getAttribute("href")
    ).toContain("month=2026-12");
  });

  it("shows dated client approvals without inventing a meeting", () => {
    render(
      <ScheduleBoard
        month="2026-11"
        selectedDate="2026-11-03"
        path="/portal/calendar"
        view="week"
        items={[
          {
            id: "approval-1",
            date: "2026-11-03",
            title: "Approve prototype",
            context: "Client A · Decision",
            kind: "approval",
            href: "/portal/projects/example#approvals"
          }
        ]}
      />
    );
    expect(screen.getAllByText("Approve prototype")).toHaveLength(2);
    expect(
      screen
        .getAllByRole("link", { name: /Approve prototype/ })
        .some((link) => link.getAttribute("href")?.includes("#approvals"))
    ).toBe(true);
  });

  it("offers a real empty state without generating sample events", () => {
    render(
      <ScheduleBoard month="2026-11" path="/admin/calendar" items={[]} view="week" />
    );
    expect(screen.getByText("Nothing scheduled yet.")).toBeTruthy();
    expect(screen.getByText("No scheduled items this week")).toBeTruthy();
  });
});
