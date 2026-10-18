import { notFound } from "next/navigation";

import { getService } from "@/modules/cms/services/queries";
export default async function ServicePreview({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const service = await getService((await params).id);
  if (!service) notFound();
  return (
    <article className="p-6 max-w-3xl">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide">
        Internal preview
      </p>
      <h1 className="text-3xl font-bold">{service.title}</h1>
      <p className="mt-4 text-lg">{service.summary}</p>
      <p className="mt-6 whitespace-pre-wrap">{service.description}</p>
      <ul className="mt-6 list-disc pl-5">
        {service.capabilities.map((capability) => (
          <li key={capability.id}>{capability.title}</li>
        ))}
      </ul>
    </article>
  );
}
