import { NextResponse } from "next/server";

import { isSameOriginJsonRequest } from "@/modules/portal/domain/request-origin";
import {
  DeliveryFileError,
  reserveDeliveryFile
} from "@/modules/portal/server/delivery-file-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    if (!isSameOriginJsonRequest(request)) {
      return NextResponse.json(
        { message: "Request origin not permitted." },
        { status: 403 }
      );
    }
    if (Number(request.headers.get("content-length") ?? "0") > 8192) {
      return NextResponse.json({ message: "Request too large." }, { status: 413 });
    }
    const body: unknown = await request.json();
    return NextResponse.json(await reserveDeliveryFile(body), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const known = error instanceof DeliveryFileError ? error : null;
    return NextResponse.json(
      { message: known?.safeMessage ?? "Upload could not be prepared." },
      { status: known?.status ?? 400 }
    );
  }
}
