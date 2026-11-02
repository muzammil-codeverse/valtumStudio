import { NextResponse } from "next/server";

import {
  DeliveryFileError,
  downloadDeliveryFile
} from "@/modules/portal/server/delivery-file-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    return await downloadDeliveryFile(id);
  } catch (error) {
    const known = error instanceof DeliveryFileError ? error : null;
    return NextResponse.json(
      { message: known?.safeMessage ?? "File is not available." },
      { status: known?.status ?? 404, headers: { "Cache-Control": "no-store" } }
    );
  }
}
