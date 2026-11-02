export type LeadDemandItem = Readonly<{
  key: string;
  label: string;
  count: number;
}>;

export function friendlyProjectType(value: string): string {
  return value
    .split("_")
    .map((word) =>
      word === "AI" || word === "API" || word === "WEB" ? word : word.toLowerCase()
    )
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAi\b/g, "AI")
    .replace(/\bApi\b/g, "API");
}

export function summarizeLeadOutcomes(
  statuses: ReadonlyArray<{ key: string; count: number }>
): Readonly<{ won: number; lost: number; decided: number; percent: number | null }> {
  const won = statuses.find((item) => item.key === "WON")?.count ?? 0;
  const lost = statuses.find((item) => item.key === "LOST")?.count ?? 0;
  const decided = won + lost;
  return {
    won,
    lost,
    decided,
    percent: decided === 0 ? null : Math.round((won / decided) * 100)
  };
}
