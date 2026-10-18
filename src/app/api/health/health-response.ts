export type HealthResponse = Readonly<{
  service: "siglum-studio-web";
  status: "ok";
  timestamp: string;
}>;

export function createHealthResponse(now: Date = new Date()): HealthResponse {
  return Object.freeze({
    service: "siglum-studio-web",
    status: "ok",
    timestamp: now.toISOString()
  });
}
