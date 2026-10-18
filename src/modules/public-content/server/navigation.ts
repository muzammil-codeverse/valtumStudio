import "server-only";

import { prisma } from "@/lib/database";

import { isSafeNavigationHref } from "../domain/navigation";
import type { PublicNavigationItemDTO } from "../types/dto";
import { cacheTags, withPublicCache } from "./cache";

/**
 * Fetches and assembles navigation items for the given location.
 * Filters disabled items, detects cycle loops, handles orphans, and enforces a max depth of 3.
 */
export async function getPublicNavigation(
  location: "PRIMARY" | "FOOTER" | "LEGAL"
): Promise<ReadonlyArray<PublicNavigationItemDTO>> {
  const query = async () => {
    const items = await prisma.navigationItem.findMany({
      where: {
        location,
        isEnabled: true
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        label: true,
        href: true,
        parentId: true,
        openInNewTab: true
      }
    });

    interface MappedNavigationItem {
      id: string;
      type: "INTERNAL" | "EXTERNAL" | "GROUP" | "CTA";
      label: string;
      href: string | null;
      parentId: string | null;
      openInNewTab: boolean;
      children: MappedNavigationItem[];
    }

    // 1. Build lookup map and validate links
    const itemMap = new Map<string, MappedNavigationItem>();
    for (const item of items) {
      if (isSafeNavigationHref(item.href, item.type)) {
        itemMap.set(item.id, {
          id: item.id,
          type: item.type,
          label: item.label,
          href: item.href,
          parentId: item.parentId,
          openInNewTab: item.openInNewTab,
          children: []
        });
      }
    }

    const rootItems: MappedNavigationItem[] = [];

    // 2. Build parent-child tree
    for (const item of items) {
      const mapped = itemMap.get(item.id);
      if (!mapped) continue; // skipped due to unsafe link

      if (mapped.parentId === null) {
        rootItems.push(mapped);
      } else {
        const parent = itemMap.get(mapped.parentId);
        if (parent) {
          parent.children.push(mapped);
        }
        // Orphans (parents that are disabled/missing) are ignored because they are not root and won't be attached.
      }
    }

    // 3. Tree depth bound and cycle detection
    const buildTree = (
      node: MappedNavigationItem,
      depth: number,
      visited: Set<string>
    ): PublicNavigationItemDTO | null => {
      if (depth > 3 || visited.has(node.id)) {
        return null; // Bounded tree depth to 3 & cycle detection
      }

      const nextVisited = new Set(visited);
      nextVisited.add(node.id);

      const children: PublicNavigationItemDTO[] = [];
      for (const child of node.children) {
        const subtree = buildTree(child, depth + 1, nextVisited);
        if (subtree) {
          children.push(subtree);
        }
      }

      return {
        type: node.type,
        label: node.label,
        href: node.type === "GROUP" ? null : node.href,
        openInNewTab: node.openInNewTab,
        children
      };
    };

    const finalTree: PublicNavigationItemDTO[] = [];
    for (const root of rootItems) {
      const tree = buildTree(root, 1, new Set());
      if (tree) {
        finalTree.push(tree);
      }
    }

    return finalTree;
  };

  return withPublicCache(query, {
    keyParts: ["navigation", location],
    tags: [cacheTags.navigation(location)]
  });
}
