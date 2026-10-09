import { useEffect } from "react";
import { useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getAbsoluteUrl,
  pageSeo,
  seoKeywords,
  siteConfig,
} from "@/config/site";
import { SITE_IMAGES } from "@/config/site-images";

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
  let element = document.getElementById("alwaseet-schema-jsonld") as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement("script");
    element.id = "alwaseet-schema-jsonld";
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.text = JSON.stringify(schema);
}

export default function SEOManager() {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const isAccountPage = location.pathname.startsWith("/accounts/");
    const isGiftCardPage = location.pathname.startsWith("/gift-cards/");
    const seo =
      pageSeo[location.pathname] ??
      (isGiftCardPage
        ? {
            ...pageSeo["/gift-cards"],
            canonicalPath: location.pathname,
            title: {
              ar: "Gift Card | الوسيط العالمي للحوالات",
              en: "Gift Card | Alwaseet Global",
            },
          }
        : undefined) ??
      (isAccountPage
        ? {
            ...pageSeo["/accounts"],
            canonicalPath: location.pathname,
            title: {
              ar: "حساب تحويل مباشر | الوسيط العالمي للحوالات",
              en: "حساب تحويل مباشر | الوسيط العالمي للحوالات",
            },
          }
        : pageSeo["/"]);
    const title = seo.title[language];
    const description = seo.description[language];
    const canonicalUrl = getAbsoluteUrl(seo.canonicalPath);
    const pageUrl = getAbsoluteUrl(location.pathname);
    const imageUrl = getAbsoluteUrl(siteConfig.socialPreviewImage);
    const locale = "ar_LY";

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", seoKeywords.join(", "));
    upsertMeta("name", "author", siteConfig.name);
    upsertMeta("name", "robots", "index, follow, max-image-preview:large");
    upsertMeta("name", "theme-color", "#0f3b82");

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", siteConfig.name);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:secure_url", imageUrl);
    upsertMeta("property", "og:image:type", "image/png");
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", `معاينة ${siteConfig.name}`);
    upsertMeta("property", "og:locale", locale);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", `معاينة ${siteConfig.name}`);

    upsertLink("canonical", canonicalUrl);
    upsertLink("icon", SITE_IMAGES.branding.favicon);

    upsertJsonLd([
      {
        "@context": "https://schema.org",
        "@type": "FinancialService",
        "@id": `${siteConfig.siteUrl}/#financial-service`,
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
        inLanguage: "ar-LY",
        isPartOf: {
          "@id": `${siteConfig.siteUrl}/#financial-service`,
        },
      },
    ]);
  }, [language, location.pathname]);

  return null;
}
