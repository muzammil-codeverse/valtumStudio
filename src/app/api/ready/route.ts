import { isDatabaseReady } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ready = await isDatabaseReady();

  return Response.json(
    {
      service: "siglum-studio",
      status: ready ? "ready" : "not_ready"
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      },
      status: ready ? 200 : 503
    }
  );
}
