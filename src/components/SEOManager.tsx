import {applyContentSeo} from '@/lib/content-seo';
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useSiteContent } from "@/hooks/useSiteContent";
import { trpc } from "@/providers/trpc";
import { giftCardSlug, resolvePageSeo } from "@/config/seo";
import { buildSeoTags, serializeJsonLd } from "@/lib/seo";


export default function SEOManager() {
  const location = useLocation();
  const { query: cms } = useSiteContent();
  const slug = giftCardSlug(location.pathname);
  const cardQuery = trpc.giftCards.bySlug.useQuery({ slug: slug || "not-found" }, { enabled: Boolean(slug) });
  const card = slug ? cardQuery.data?.card : undefined;
  const missing = Boolean(slug && !cardQuery.isLoading && !card);

  useEffect(() => {
    const seo = applyContentSeo(resolvePageSeo(location.pathname, { giftCard: card, notFound: missing }),cms.data??{});
    const tags = buildSeoTags(seo);
    const vals = cms.data ?? {};
    document.title = tags.title;
    if (vals.site_favicon) {
      let favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) { favicon = document.createElement("link"); favicon.rel = "icon"; document.head.appendChild(favicon); }
      favicon.href = vals.site_favicon;
    }
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
  }, [location.pathname, card, missing, cms.data]);
  return null;
}
