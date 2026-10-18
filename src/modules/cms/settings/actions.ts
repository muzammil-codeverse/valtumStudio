"use server";

import { prisma } from "@/lib/database";

import { authorizeCms, toActionFailure } from "../shared/server/action";
import { invalidateSiteSettings } from "../shared/server/cache";
import { toPrismaStructuredJson } from "../shared/server/json";
import { type ActionResult, success } from "../shared/types/action-result";
import { isSafeSettingKey, settingsRegistry } from "./registry";

export async function saveSettingsAction(
  _state: ActionResult<{ group: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ group: string }>> {
  try {
    const principal = await authorizeCms("siteSettings", "update");
    const group = String(formData.get("group") ?? "");

    if (!isSafeSettingKey(group)) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Unknown or unsafe settings group.",
        fieldErrors: { group: ["Select an approved settings group."] }
      };
    }

    let value: unknown;

    try {
      value = JSON.parse(String(formData.get("value") ?? ""));
    } catch {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Settings must be valid structured data.",
        fieldErrors: { value: ["Invalid settings data."] }
      };
    }

    const parsed = settingsRegistry[group].parse(value);
    const settingsValue = toPrismaStructuredJson(parsed);

    await prisma.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key: `site.${group}` },
        create: {
          key: `site.${group}`,
          value: settingsValue
        },
        update: { value: settingsValue }
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: principal.userId,
          action: "SETTINGS_UPDATED",
          entityType: "SiteSetting",
          entityId: `site.${group}`,
          entityLabel: group,
          summary: `Updated ${group} settings.`
        }
      });
    });

    invalidateSiteSettings();
    return success({ group });
  } catch (error) {
    return toActionFailure(error);
  }
}
