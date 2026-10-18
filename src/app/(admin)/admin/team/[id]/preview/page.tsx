import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
import { validateRichTextDocument } from "@/modules/cms/shared/domain/rich-text";
import { RichTextRenderer } from "@/modules/cms/shared/ui/RichTextRenderer";
export default async function TeamPreview({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "team", "read");
  const member = await prisma.teamMember.findUnique({
    where: { id: (await params).id }
  });
  if (!member) notFound();
  const document = member.bioJson && validateRichTextDocument(member.bioJson);
  return (
    <article className="p-6 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide">
        Internal preview
      </p>
      <h1 className="text-3xl font-bold">{member.name}</h1>
      <p className="mt-2 text-lg">{member.roleTitle}</p>
      <p className="mt-4">{member.shortBio}</p>
      {document ? (
        <div className="mt-8">
          <RichTextRenderer document={document} />
        </div>
      ) : null}
    </article>
  );
}
