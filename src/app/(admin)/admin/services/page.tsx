import { listServices } from "@/modules/cms/services/queries";
import { CmsList } from "@/modules/cms/shared/ui/CmsList";
export default async function ServicesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<React.JSX.Element> {
  const { items } = await listServices(await searchParams);
  return (
    <CmsList
      title="Services"
      description="Create, organize, preview, and publish structured service offerings."
      items={items}
      createHref="/admin/services/new"
      editBase="/admin/services"
      emptyMessage="No service offerings match these filters."
    />
  );
}
