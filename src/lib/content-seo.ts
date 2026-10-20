import { SITE_URL, type SeoPage } from "../config/seo";

export function applyContentSeo(
  seo: SeoPage,
  values: Record<string, string>
): SeoPage {
  if (seo.noindex || seo.status !== 200) return seo;
  const prefix =
    seo.path === "/"
      ? "seo_home"
      : seo.path === "/transfers"
        ? "seo_transfers"
        : seo.path === "/contact"
          ? "seo_contact"
          : seo.path === "/gift-cards"
            ? "seo_gift_cards"
            : "";
  const title = (prefix && values[`${prefix}_title`]) || values.seo_title;
  const description =
    (prefix && values[`${prefix}_description`]) || values.seo_description;
  const image = values.seo_og_image;
  return {
    ...seo,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(image
      ? {
          image: {
            url: new URL(image, SITE_URL).href,
            alt: values.site_name || title || seo.title,
          },
        }
      : {}),
  };
}
