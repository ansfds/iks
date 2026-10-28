import { z } from "zod";

import { createRouter, adminQuery, publicQuery } from "./middleware";
import { readContent, upsertSetting } from "./cms/store";
import { VISUAL_FIELDS, type VisualKey } from "../contracts/visual-content";

import {
  CONTENT_KEYS,
  type ContentKey,
  validateValue,
} from "./site-content-fields";
export { CONTENT_KEYS } from "./site-content-fields";
const keySchema = z.enum(CONTENT_KEYS);
const imageKeys = new Set([
  "site_logo",
  "site_favicon",
  "hero_image",
  "about_image",
  "services_image",
  "seo_og_image",
]);
const jsonKeys = new Set(["site_phones", "site_hours"]);
const urlKeys = new Set(["site_facebook", "site_map_url"]);
function saveValue(key: ContentKey, value: string) {
  validateValue(key, value);
  const image =
    imageKeys.has(key) ||
    (key in VISUAL_FIELDS && VISUAL_FIELDS[key as VisualKey].kind === "image");
  upsertSetting(
    key,
    value,
    jsonKeys.has(key)
      ? "json"
      : image
        ? "image"
        : urlKeys.has(key)
          ? "url"
          : "text"
  );
}
export const siteContentRouter = createRouter({
  public: publicQuery.query(() =>
    Object.fromEntries(
      readContent()
        .collections.siteSettings.filter(
          row => row.isPublic && CONTENT_KEYS.includes(row.key as ContentKey)
        )
        .map(row => [row.key, row.value || ""])
    )
  ),
  admin: createRouter({
    saveBatch: adminQuery
      .input(
        z
          .object({
            changes: z
              .array(
                z
                  .object({ key: keySchema, value: z.string().max(12000) })
                  .strict()
              )
              .min(1)
              .max(80),
          })
          .strict()
      )
      .mutation(({ input }) => {
        for (const change of input.changes) saveValue(change.key, change.value);
        return { success: true };
      }),
    list: adminQuery.query(() =>
      readContent().collections.siteSettings.filter(row =>
        CONTENT_KEYS.includes(row.key as ContentKey)
      )
    ),
    save: adminQuery
      .input(z.object({ key: keySchema, value: z.string().max(12000) }))
      .mutation(({ input }) => {
        saveValue(input.key, input.value);
        return { success: true };
      }),
  }),
});
