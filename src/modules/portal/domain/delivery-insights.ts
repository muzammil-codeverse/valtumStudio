export type DeliveryEngagement = Readonly<{
  id: string;
  title: string;
  status: string;
}>;

export type DeliveryItem = Readonly<{
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  engagement: Readonly<{ id: string; title: string }>;
}>;

export type DeliveryInput = Readonly<{
  engagements: readonly DeliveryEngagement[];
  tasks: readonly DeliveryItem[];
  milestones: readonly DeliveryItem[];
}>;

export type DeliveryMonth = Readonly<{
  key: string;
  label: string;
  count: number;
}>;

export function summarizeDelivery(data: DeliveryInput, today: Date = new Date()) {
  const tasksDone = data.tasks.filter((item) => item.status === "DONE").length;
  const milestonesDone = data.milestones.filter(
    (item) => item.status === "COMPLETE" || item.status === "APPROVED"
  ).length;
  const blocked = data.tasks.filter((item) => item.status === "BLOCKED").length;
  const active = data.engagements.filter(
    (item) => item.status === "ACTIVE" || item.status === "REVIEW"
  ).length;
  const taskPercent =
    data.tasks.length > 0 ? Math.round((tasksDone / data.tasks.length) * 100) : null;
  const milestonePercent =
    data.milestones.length > 0
      ? Math.round((milestonesDone / data.milestones.length) * 100)
      : null;
  const firstDay = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const horizon = new Date(firstDay.getTime() + 30 * 86400000);
  const schedule = [
    ...data.tasks.map((item) => ({ ...item, kind: "Task" as const })),
    ...data.milestones.map((item) => ({ ...item, kind: "Milestone" as const }))
  ];
  const upcoming = schedule
    .filter(
      (item) =>
        item.dueDate !== null &&
        item.dueDate >= firstDay &&
        item.dueDate < horizon &&
        item.status !== "DONE" &&
        item.status !== "COMPLETE" &&
        item.status !== "APPROVED"
    )
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 8);

  const months: DeliveryMonth[] = Array.from({ length: 6 }, (_, index) => {
    const first = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5 + index, 1)
    );
    const key = first.toISOString().slice(0, 7);
    return {
      key,
      label: new Intl.DateTimeFormat("en-AU", {
        month: "short",
        timeZone: "UTC"
      }).format(first),
      count: schedule.filter((item) => item.dueDate?.toISOString().startsWith(key))
        .length
    };
  });
  const monthMax = Math.max(1, ...months.map((item) => item.count));
  const projects = data.engagements.map((project) => {
    const tasks = data.tasks.filter((task) => task.engagement.id === project.id);
    const completed = tasks.filter((task) => task.status === "DONE").length;
    return {
      ...project,
      taskCount: tasks.length,
      tasksDone: completed,
      percent: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : null
    };
  });
  return {
    tasksDone,
    milestonesDone,
    blocked,
    active,
    taskPercent,
    milestonePercent,
    upcoming,
    months,
    monthMax,
    projects
  };
}
