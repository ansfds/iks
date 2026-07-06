import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAbsoluteUrl,
  pageSeo,
  seoKeywords,
  siteConfig,
} from "@/config/site";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function upsertJsonLd(schema: unknown) {
  let element = document.getElementById("iks-schema-jsonld") as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement("script");
    element.id = "iks-schema-jsonld";
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.text = JSON.stringify(schema);
}

export default function SEOManager() {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const seo = pageSeo[location.pathname] ?? pageSeo["/"];
    const title = seo.title[language];
    const description = seo.description[language];
    const canonicalUrl = getAbsoluteUrl(seo.canonicalPath);
    const pageUrl = getAbsoluteUrl(location.pathname);
    const imageUrl = getAbsoluteUrl(siteConfig.socialPreviewImage);
    const locale = language === "ar" ? "ar_LY" : "en_US";
    const alternateLocale = language === "ar" ? "en_US" : "ar_LY";

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", seoKeywords.join(", "));
    upsertMeta("name", "author", siteConfig.name);
    upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    upsertMeta("name", "theme-color", "#7A1E2A");

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", siteConfig.name);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:secure_url", imageUrl);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", `${siteConfig.name} social preview`);
    upsertMeta("property", "og:locale", locale);
    upsertMeta("property", "og:locale:alternate", alternateLocale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", `${siteConfig.name} social preview`);

    upsertLink("canonical", canonicalUrl);

    upsertJsonLd([
      {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": `${siteConfig.siteUrl}/#school`,
        name: siteConfig.name,
        alternateName: siteConfig.alternateNames,
        url: siteConfig.siteUrl,
        logo: imageUrl,
        image: imageUrl,
        email: siteConfig.email,
        telephone: siteConfig.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.address.street,
          addressLocality: siteConfig.address.city,
          addressCountry: siteConfig.address.countryCode,
        },
        sameAs: siteConfig.socialLinks,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage: language === "ar" ? "ar-LY" : "en",
        isPartOf: {
          "@id": `${siteConfig.siteUrl}/#school`,
        },
      },
    ]);
  }, [language, location.pathname]);

  return null;
}
