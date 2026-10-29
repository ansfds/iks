import {
  DEFAULT_DESCRIPTION,
  resolveSocialImage,
  type SeoPage,
} from "../config/seo";

function visiblePhones(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  try {
    const rows: unknown = JSON.parse(value);
    if (
      !Array.isArray(rows) ||
      !rows.every(
        row =>
          row &&
          typeof row.number === "string" &&
          /^\+?\d{7,16}$/.test(row.number) &&
          typeof row.visible === "boolean"
      )
    )
      return undefined;
    return rows.filter(row => row.visible).map(row => row.number);
  } catch {
    return undefined;
  }
}

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
  // General settings describe the home page. Inner pages keep their own metadata.
  const title =
    (prefix && values[`${prefix}_title`]) ||
    (seo.path === "/" ? values.seo_title : "");
  const description =
    (prefix && values[`${prefix}_description`]) ||
    (seo.path === "/" ? values.seo_description : "");
  const image = values.seo_og_image;
  return {
    ...seo,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    image: resolveSocialImage(
      image
        ? { url: image, alt: values.site_name || title || seo.title }
        : seo.image
    ),
    business: {
      description: values.seo_description || DEFAULT_DESCRIPTION,
      logo: values.site_logo || undefined,
      phones: visiblePhones(values.site_phones),
      address: values.site_address || undefined,
      socialLinks: values.site_facebook ? [values.site_facebook] : undefined,
    },
  };
}
