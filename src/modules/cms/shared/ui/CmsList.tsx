import Link from "next/link";

import { PublicationStatusBadge } from "@/modules/admin/ui/components/badges";
import { Button } from "@/modules/admin/ui/components/buttons";
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableEmpty,
  AdminTableFrame,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow
} from "@/modules/admin/ui/components/tables";
import {
  AdminPageBody,
  AdminPageContainer,
  AdminPageHeader
} from "@/modules/admin/ui/shell/PageComposition";
export type CmsListItem = Readonly<{
  id: string;
  title: string;
  slug?: string;
  status?: string;
  updatedAt?: Date;
  summary?: string;
}>;
export function CmsList({
  title,
  description,
  items,
  createHref,
  editBase,
  emptyMessage
}: {
  title: string;
  description: string;
  items: CmsListItem[];
  createHref?: string;
  editBase: string;
  emptyMessage: string;
}): React.JSX.Element {
  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          createHref ? (
            <Link href={createHref}>
              <Button variant="primary">Create</Button>
            </Link>
          ) : undefined
        }
      />
      <AdminPageBody>
        <AdminTableFrame>
          <AdminTable>
            <AdminTableHead>
              <AdminTableRow>
                <AdminTableHeaderCell>Title</AdminTableHeaderCell>
                <AdminTableHeaderCell>Slug</AdminTableHeaderCell>
                <AdminTableHeaderCell>Status</AdminTableHeaderCell>
                <AdminTableHeaderCell align="right">Updated</AdminTableHeaderCell>
              </AdminTableRow>
            </AdminTableHead>
            <AdminTableBody>
              {items.length === 0 ? (
                <AdminTableEmpty colSpan={4} message={emptyMessage} />
              ) : (
                items.map((item) => (
                  <AdminTableRow key={item.id}>
                    <AdminTableCell isPrimary>
                      <Link className="hover:underline" href={`${editBase}/${item.id}`}>
                        {item.title}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell className="font-mono text-[11px]">
                      {item.slug ?? "—"}
                    </AdminTableCell>
                    <AdminTableCell>
                      {item.status ? (
                        <PublicationStatusBadge status={item.status} />
                      ) : (
                        "—"
                      )}
                    </AdminTableCell>
                    <AdminTableCell align="right" className="text-[11px]">
                      {item.updatedAt?.toLocaleDateString() ?? "—"}
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminTableFrame>
      </AdminPageBody>
    </AdminPageContainer>
  );
}
