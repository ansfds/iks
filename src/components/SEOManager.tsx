import { useEffect } from "react";
import { useLocation } from "react-router";
import { giftCardSlug, resolvePageSeo } from "@/config/seo";
import { buildSeoTags, serializeJsonLd } from "@/lib/seo";
import { trpc } from "@/providers/trpc";

export default function SEOManager() {
  const location = useLocation();
  const slug = giftCardSlug(location.pathname);
  const cardQuery = trpc.giftCards.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: Boolean(slug), staleTime: 20_000, retry: 1 },
  );
  const card = cardQuery.data?.card;
  const missing = Boolean(slug && cardQuery.isSuccess && !card);
  const unavailable = Boolean(slug && cardQuery.isError);

  useEffect(() => {
    const seo = resolvePageSeo(location.pathname, { giftCard: card, notFound: missing, unavailable });
    const tags = buildSeoTags(seo);
    document.title = tags.title;
    const expected = new Set<string>();
    for (const item of tags.meta) {
      const attribute = "property" in item ? "property" : "name";
      const key = "property" in item ? item.property : item.name;
      const selector = `meta[${attribute}="${key}"]`;
      expected.add(selector);
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key!); document.head.appendChild(element); }
      element.content = item.content;
    }
    for (const key of ["og:image:width", "og:image:height", "og:image:type"]) {
      const selector = `meta[property="${key}"]`;
      if (!expected.has(selector)) document.head.querySelector(selector)?.remove();
    }
    for (const item of tags.links) {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${item.rel}"]`);
      if (!link) { link = document.createElement("link"); link.rel = item.rel; document.head.appendChild(link); }
      link.href = item.href;
    }
    let schema = document.getElementById("alwaseet-schema-jsonld") as HTMLScriptElement | null;
    if (!schema) { schema = document.createElement("script"); schema.id = "alwaseet-schema-jsonld"; schema.type = "application/ld+json"; document.head.appendChild(schema); }
    schema.textContent = serializeJsonLd(tags.schema);
  }, [location.pathname, card, missing, unavailable]);
  return null;
}