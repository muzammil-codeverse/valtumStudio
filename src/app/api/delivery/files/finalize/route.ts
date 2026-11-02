import { NextResponse } from "next/server";

import { isSameOriginJsonRequest } from "@/modules/portal/domain/request-origin";
import {
  DeliveryFileError,
  finalizeDeliveryFile
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
    if (Number(request.headers.get("content-length") ?? "0") > 2048) {
      return NextResponse.json({ message: "Request too large." }, { status: 413 });
    }
    const body: unknown = await request.json();
    const id =
      typeof body === "object" && body !== null && "fileId" in body
        ? body.fileId
        : null;
    return NextResponse.json(await finalizeDeliveryFile(id), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const known = error instanceof DeliveryFileError ? error : null;
    return NextResponse.json(
      { message: known?.safeMessage ?? "Upload verification was unsuccessful." },
      { status: known?.status ?? 400 }
    );
  }
}
