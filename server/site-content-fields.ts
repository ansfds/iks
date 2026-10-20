import { TRPCError } from "@trpc/server";
import { safeMediaUrl } from "./media-url";
/** Only these keys can be read publicly or edited by this dedicated CMS endpoint. */
export const CONTENT_KEYS = [
  "site_name",
  "site_name_en",
  "site_logo",
  "site_favicon",
  "site_address",
  "site_phones",
  "site_whatsapp",
  "site_gift_whatsapp",
  "site_hours",
  "site_facebook",
  "site_map_url",
  "hero_title",
  "hero_subtitle",
  "hero_cta",
  "about_title",
  "about_description",
  "hero_image",
  "about_image",
  "services_image",
  "footer_description",
  "seo_title",
  "seo_description",
  "seo_og_image",
  "seo_home_title",
  "seo_home_description",
  "seo_transfers_title",
  "seo_transfers_description",
  "seo_contact_title",
  "seo_contact_description",
  "seo_gift_cards_title",
  "seo_gift_cards_description",
  "section_hero",
  "section_about",
  "section_services",
  "section_gift_cards",
  "section_banks",
  "section_contact",
  "nav_home",
  "nav_about",
  "nav_services",
  "nav_gift_cards",
  "nav_transfers",
  "nav_contact",
] as const;

export type ContentKey = (typeof CONTENT_KEYS)[number];
const imageKeys = new Set<ContentKey>([
  "site_logo",
  "site_favicon",
  "hero_image",
  "about_image",
  "services_image",
  "seo_og_image",
]);
const urlKeys = new Set<ContentKey>(["site_facebook", "site_map_url"]);
const flagKeys = new Set<ContentKey>(
  CONTENT_KEYS.filter(
    key => key.startsWith("section_") || key.startsWith("nav_")
  )
);
const jsonKeys = new Set<ContentKey>(["site_phones", "site_hours"]);
const phone = /^\+?[0-9()\s-]{7,24}$/;

function safeImage(value: string) {
  return safeMediaUrl(value);
}

export function validateValue(key: ContentKey, value: string) {
  if (value.length > 12000)
    throw new TRPCError({ code: "BAD_REQUEST", message: "النص طويل جدًا." });
  if (imageKeys.has(key) && value && !safeImage(value))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "الصورة يجب أن تستخدم HTTPS أو مسارًا محليًا صحيحًا.",
    });
  if (urlKeys.has(key) && value && !safeImage(value))
    throw new TRPCError({ code: "BAD_REQUEST", message: "الرابط غير صالح." });
  if (flagKeys.has(key) && !["true", "false"].includes(value))
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "قيمة الإظهار غير صحيحة.",
    });
  if (
    ["site_whatsapp", "site_gift_whatsapp"].includes(key) &&
    value &&
    !/^\+?\d{7,16}$/.test(value)
  )
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "رقم واتساب غير صحيح.",
    });
  if (jsonKeys.has(key)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "البيانات ليست JSON صالحة.",
      });
    }
    if (!Array.isArray(parsed) || parsed.length > 50)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "القائمة يجب أن تحتوي 50 عنصرًا على الأكثر.",
      });
    if (
      key === "site_phones" &&
      !parsed.every(
        x =>
          typeof x === "object" &&
          x &&
          typeof x.number === "string" &&
          phone.test(x.number) &&
          typeof x.visible === "boolean"
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "قائمة أرقام الهواتف غير صحيحة.",
      });
    }
    if (
      key === "site_hours" &&
      !parsed.every(
        x =>
          typeof x === "object" &&
          x &&
          typeof x.label === "string" &&
          typeof x.hours === "string" &&
          x.label.length < 100 &&
          x.hours.length < 100
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "قائمة ساعات العمل غير صحيحة.",
      });
    }
  }
  // React renders plain strings, never HTML. Reject basic markup entirely.
  if (
    !imageKeys.has(key) &&
    !urlKeys.has(key) &&
    !jsonKeys.has(key) &&
    /<[^>]*>/.test(value)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "لا يُسمح بعلامات HTML داخل النص.",
    });
  }
}
