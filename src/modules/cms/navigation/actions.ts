"use server";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/database";

import {
  assertRevisionMatch,
  requireUpdateIdentity
} from "../shared/domain/concurrency";
import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateNavigationContent } from "../shared/server/cache";
import { type ActionResult, success } from "../shared/types/action-result";
import { navigationSchema } from "./schemas";

function parseNavigationForm(formData: FormData) {
  return navigationSchema.parse({
    ...Object.fromEntries(formData),
    isEnabled: formData.get("isEnabled") === "on",
    openInNewTab: formData.get("openInNewTab") === "on"
  });
}

async function assertValidParent(
  tx: Prisma.TransactionClient,
  id: string | undefined,
  parentId: string | undefined,
  location: "PRIMARY" | "FOOTER" | "LEGAL"
): Promise<void> {
  if (!parentId) {
    return;
  }

  if (id === parentId) {
    throw new Error("CMS_CONFLICT");
  }

  const parent = await tx.navigationItem.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true, location: true }
  });

  if (!parent || parent.location !== location) {
    throw new Error("CMS_NOT_FOUND");
  }

  let cursor = parent;
  let depth = 1;

  while (cursor.parentId) {
    if (cursor.parentId === id || depth >= 3) {
      throw new Error("CMS_CONFLICT");
    }

    const next = await tx.navigationItem.findUnique({
      where: { id: cursor.parentId },
      select: { id: true, parentId: true, location: true }
    });

    if (!next || next.location !== location) {
      throw new Error("CMS_CONFLICT");
    }

    cursor = next;
    depth += 1;
  }
}

export async function saveNavigationAction(
  _state: ActionResult<{ id: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms(
      "navigation",
      formData.get("id") ? "update" : "create"
    );
    const input = parseNavigationForm(formData);
    const item = await prisma.$transaction(async (tx) => {
      await assertValidParent(
        tx,
        input.id,
        input.parentId ?? undefined,
        input.location
      );

      const data = {
        location: input.location,
        type: input.type,
        label: input.label,
        href: input.type === "GROUP" ? null : (input.href ?? null),
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder,
        isEnabled: input.isEnabled,
        openInNewTab: input.type === "EXTERNAL" && input.openInNewTab,
        updatedById: principal.userId
      };
      let saved;
      let action: "CREATED" | "UPDATED";
      let oldLocation: string | null = null;

      if (input.id) {
        const existing = await tx.navigationItem.findUnique({
          where: { id: input.id },
          select: { location: true }
        });
        oldLocation = existing?.location ?? null;

        const { id, revision } = requireUpdateIdentity(input.id, input.revision);
        const updated = await tx.navigationItem.updateMany({
          where: { id, revision },
          data: { ...data, revision: { increment: 1 } }
        });

        assertRevisionMatch(updated.count);
        saved = await tx.navigationItem.findUniqueOrThrow({ where: { id } });
        action = "UPDATED";
      } else {
        saved = await tx.navigationItem.create({
          data: { ...data, createdById: principal.userId }
        });
        action = "CREATED";
      }

      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action,
          entityType: "NavigationItem",
          entityId: saved.id,
          entityLabel: saved.label,
          summary:
            action === "UPDATED"
              ? "Updated navigation item."
              : "Created navigation item."
        }
      });

      return { id: saved.id, location: saved.location, oldLocation };
    });

    invalidateNavigationContent(item.id, [
      item.location,
      ...(item.oldLocation ? [item.oldLocation] : [])
    ]);
    return success({ id: item.id });
  } catch (error) {
    return toActionFailure(error);
  }
}

export async function moveNavigationItemAction(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult<{ id: string }>> {
  try {
    const principal = await authorizeCms("navigation", "update");
    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.navigationItem.findUnique({ where: { id } });

      if (!current) {
        throw new Error("CMS_NOT_FOUND");
      }

      const sibling = await tx.navigationItem.findFirst({
        where: {
          location: current.location,
          parentId: current.parentId,
          ...(direction === "up"
            ? { sortOrder: { lt: current.sortOrder } }
            : { sortOrder: { gt: current.sortOrder } })
        },
        orderBy: { sortOrder: direction === "up" ? "desc" : "asc" }
      });

      if (!sibling) {
        return current;
      }

      await tx.navigationItem.update({
        where: { id: current.id },
        data: {
          sortOrder: sibling.sortOrder,
          revision: { increment: 1 },
          updatedById: principal.userId
        }
      });
      await tx.navigationItem.update({
        where: { id: sibling.id },
        data: {
          sortOrder: current.sortOrder,
          revision: { increment: 1 },
          updatedById: principal.userId
        }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action: "REORDERED",
          entityType: "NavigationItem",
          entityId: id,
          entityLabel: current.label,
          summary: "Reordered navigation item."
        }
      });

      return current;
    });

    invalidateNavigationContent(item.id, [item.location]);
    return success({ id: item.id });
  } catch (error) {
    return toActionFailure(error);
  }
}
