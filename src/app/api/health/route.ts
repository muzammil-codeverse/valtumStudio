import { createHealthResponse } from "@/app/api/health/health-response";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

export function GET(): Response {
  logger.debug("Health endpoint requested.");

  return Response.json(createHealthResponse(), {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    },
    status: 200
  });
}
