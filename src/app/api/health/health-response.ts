export type HealthResponse = Readonly<{
  service: "valtum-studio-web";
  status: "ok";
  timestamp: string;
}>;

export function createHealthResponse(now: Date = new Date()): HealthResponse {
  return Object.freeze({
    service: "valtum-studio-web",
    status: "ok",
    timestamp: now.toISOString()
  });
}
