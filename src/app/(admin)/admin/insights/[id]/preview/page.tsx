import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";
import { RichTextRenderer } from "@/modules/cms/shared/ui/RichTextRenderer";
export default async function InsightPreview({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "insights", "read");
  const insight = await prisma.insight.findUnique({
    where: { id: (await params).id },
    include: { author: true, category: true }
  });
  if (!insight) notFound();
  const document = validateRichTextDocument(insight.bodyJson);
  return (
    <article className="p-6 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide">
        Internal preview
      </p>
      <p className="text-sm">
        {insight.category.name} · {insight.author.name}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{insight.title}</h1>
      <p className="mt-4 text-lg">{insight.excerpt}</p>
      {document ? (
        <div className="mt-8">
          <RichTextRenderer document={document} />
        </div>
      ) : null}
    </article>
  );
}
