import { z } from "zod";

import { createRouter, adminQuery, publicQuery } from "./middleware";
import { readContent, upsertSetting } from "./cms/store";

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
    list: adminQuery.query(() =>
      readContent().collections.siteSettings.filter(row =>
        CONTENT_KEYS.includes(row.key as ContentKey)
      )
    ),
    save: adminQuery
      .input(z.object({ key: keySchema, value: z.string().max(12000) }))
      .mutation(({ input }) => {
        validateValue(input.key, input.value);
        upsertSetting(
          input.key,
          input.value,
          jsonKeys.has(input.key)
            ? "json"
            : imageKeys.has(input.key)
              ? "image"
              : urlKeys.has(input.key)
                ? "url"
                : "text"
        );
        return { success: true };
      }),
  }),
});
