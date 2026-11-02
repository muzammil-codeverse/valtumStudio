import { headers } from "next/headers";

import { prisma } from "@/lib/database";
import {
  getAuthenticationAssurance,
  getOptionalSession
} from "@/modules/auth/server/authorization";
import { formatCsvTable } from "@/modules/portal/domain/csv-export";
import { isClientPortalEnabled } from "@/modules/portal/server/client-data";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(): Promise<Response> {
  if (!isClientPortalEnabled()) {
    return new Response("Not found", { status: 404, headers: noStore });
  }

  const principal = await getOptionalSession(await headers());
  if (!principal) {
    return new Response("Authentication required", {
      status: 401,
      headers: noStore
    });
  }
  if (
    principal.role !== "client" ||
    getAuthenticationAssurance(principal) !== "FULLY_AUTHENTICATED"
  ) {
    return new Response("Access denied", { status: 403, headers: noStore });
  }

  // Membership is enforced inside the database filter. The browser cannot
  // supply a workspace or another customer's invoice ID.
  const invoices = await prisma.clientInvoice.findMany({
    where: {
      status: { in: ["ISSUED", "PAID"] },
      engagement: {
        workspace: { memberships: { some: { userId: principal.userId } } }
      }
    },
    select: {
      reference: true,
      status: true,
      currency: true,
      amountCents: true,
      issuedAt: true,
      dueDate: true,
      paidAt: true,
      engagement: {
        select: {
          title: true,
          workspace: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 2001
  });
  if (invoices.length > 2000) {
    return new Response("Export exceeds the permitted row limit.", {
      status: 422,
      headers: noStore
    });
  }

  const csv = formatCsvTable([
    [
      "Client workspace",
      "Project",
      "Invoice reference",
      "Status",
      "Currency",
      "Amount (minor units)",
      "Issued (UTC)",
      "Due (UTC)",
      "Recorded paid date (UTC)"
    ],
    ...invoices.map((invoice) => [
      invoice.engagement.workspace.name,
      invoice.engagement.title,
      invoice.reference,
      invoice.status,
      invoice.currency,
      invoice.amountCents,
      invoice.issuedAt?.toISOString().slice(0, 10) ?? "",
      invoice.dueDate?.toISOString().slice(0, 10) ?? "",
      invoice.paidAt?.toISOString().slice(0, 10) ?? ""
    ])
  ]);

  return new Response(csv, {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="valtum-client-invoices.csv"',
      "X-Content-Type-Options": "nosniff"
    }
  });
}
