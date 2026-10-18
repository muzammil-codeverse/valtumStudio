import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/database";
import { requirePermission } from "@/modules/auth/server/authorization";
export default async function ProjectPreview({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  await requirePermission(await headers(), "projects", "read");
  const project = await prisma.project.findUnique({ where: { id: (await params).id } });
  if (!project) notFound();
  return (
    <article className="p-6 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide">
        Internal preview
      </p>
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-4 text-lg">{project.summary}</p>
      <section className="mt-8 space-y-5">
        <div>
          <h2 className="font-semibold">Challenge</h2>
          <p>{project.challenge}</p>
        </div>
        <div>
          <h2 className="font-semibold">Solution</h2>
          <p>{project.solution}</p>
        </div>
        <div>
          <h2 className="font-semibold">Outcome</h2>
          <p>{project.outcome}</p>
        </div>
      </section>
    </article>
  );
}
