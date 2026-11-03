import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sweepExpiredDeliveryFiles } from "@/modules/portal/server/delivery-file-maintenance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function isAuthorizedMaintenanceRequest(request: Request): boolean {
  const secret = process.env["CRON_SECRET"];
  if (!secret || secret.length < 32) return false;
  const provided = request.headers.get("authorization") ?? "";
  const expected = "Bearer " + secret;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedMaintenanceRequest(request)) {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
  if (process.env["DELIVERY_MAINTENANCE_ENABLED"] !== "true") {
    return NextResponse.json(
      { message: "Maintenance is disabled." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
  try {
    const result = await sweepExpiredDeliveryFiles();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json(
      { message: "Maintenance execution failed." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      }
    );
  }
}
