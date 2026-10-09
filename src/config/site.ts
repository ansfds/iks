import { SITE_IMAGES } from "@/config/site-images";

export type LocalizedText = {
  en: string;
  ar: string;
};

export type SeoEntry = {
  title: LocalizedText;
  description: LocalizedText;
  canonicalPath: string;
};

export const siteConfig = {
  name: "الوسيط العالمي للحوالات",
  shortName: "الوسيط العالمي",
  alternateNames: ["الوسيط العالمي", "الوسيط العالمي للدفع الإلكتروني والحوالات"],
  siteUrl: import.meta.env.VITE_SITE_URL || "",
  socialPreviewImage: SITE_IMAGES.seo.socialPreview,
  email: "hosambizniz12@gmail.com",
  phone: "093-5095091",
  address: {
    street: "زناتة مقابل كيان موبايل",
    city: "طرابلس",
    country: "ليبيا",
    countryCode: "LY",
  },
  socialLinks: ["https://www.facebook.com/profile.php?id=61560408535771"] as string[],
};

export const siteImages = {
  socialPreview: SITE_IMAGES.seo.socialPreview,
  heroClassroom: SITE_IMAGES.finance.transferHero,
  studentsGroup: SITE_IMAGES.finance.globalFinance,
  scienceLab: SITE_IMAGES.finance.globalFinance,
  library: SITE_IMAGES.finance.libyaCairo,
  campus: SITE_IMAGES.finance.libyaCairo,
  aboutClassroom: SITE_IMAGES.finance.libyaCairo,
  graduation: SITE_IMAGES.finance.transferHero,
  artClassroom: SITE_IMAGES.finance.transferHero,
  sportsFacility: SITE_IMAGES.finance.globalFinance,
};

export const seoKeywords = [
  "الوسيط العالمي للحوالات",
  "حوالات مالية",
  "تحويل أموال",
  "دفع إلكتروني",
  "دفع فواتير عالمية",
  "بطاقات SHEIN",
  "تحويل اليوان الصيني",
  "بيع وشراء الدولار",
  "شحن المحافظ الإلكترونية",
  "بطاقات هدايا",
  "Gift Cards",
  "PlayStation Store",
  "Xbox Gift Card",
  "خدمات مالية في ليبيا",
];

export const pageSeo: Record<string, SeoEntry> = {
  "/": {
    canonicalPath: "/",
    title: {
      ar: "الوسيط العالمي للحوالات | الدفع الإلكتروني والحوالات",
      en: "Alwaseet Global Money Transfers | Rates, Transfers, Payments",
    },
    description: {
      ar: "حلول مالية متكاملة للدفع والتحويل والشراء من مختلف المواقع والأسواق العالمية، بسرعة وسهولة وأمان.",
      en: "Integrated financial solutions for payments, transfers, and global purchasing with speed, simplicity, and trust.",
    },
  },
  "/accounts": {
    canonicalPath: "/accounts",
    title: {
      ar: "حسابات التحويل | الوسيط العالمي للحوالات",
      en: "Transfer Accounts | Alwaseet Global",
    },
    description: {
      ar: "كل حسابات التحويل الرسمية مع البحث والتصفية وروابط QR مباشرة لكل حساب.",
      en: "Official transfer accounts with search, filters, and direct QR links for every account.",
    },
  },
  "/transfers": {
    canonicalPath: "/transfers",
    title: {
      ar: "التحويلات | الوسيط العالمي للحوالات",
      en: "التحويلات | الوسيط العالمي للحوالات",
    },
    description: {
      ar: "صفحة حسابات التحويل الرسمية لدى الوسيط العالمي للحوالات مع نسخ رقم الحساب مباشرة وبسهولة.",
      en: "صفحة حسابات التحويل الرسمية لدى الوسيط العالمي للحوالات مع نسخ رقم الحساب مباشرة وبسهولة.",
    },
  },
  "/gift-cards": {
    canonicalPath: "/gift-cards",
    title: {
      ar: "Gift Cards | الوسيط العالمي للحوالات",
      en: "Gift Cards | Alwaseet Global",
    },
    description: {
      ar: "بطاقات PlayStation وXbox الرقمية بريجن أمريكي مع طلب مباشر عبر واتس أب المتجر.",
      en: "Digital PlayStation and Xbox gift cards with direct WhatsApp ordering.",
    },
  },
  "/about": {
    canonicalPath: "/about",
    title: {
      ar: "من نحن | الوسيط العالمي للحوالات",
      en: "About | Alwaseet Global",
    },
    description: {
      ar: "تعرف على الوسيط العالمي للحوالات وخدمات الدفع الإلكتروني والتحويل والشراء العالمي من طرابلس، ليبيا.",
      en: "Learn about Alwaseet Global payment, transfer, and global purchasing services from Tripoli, Libya.",
    },
  },
  "/curriculum": {
    canonicalPath: "/curriculum",
    title: {
      ar: "الخدمات | الوسيط العالمي للحوالات",
      en: "Services | Alwaseet Global",
    },
    description: {
      ar: "خدمات دفع الفواتير العالمية والحوالات الخارجية وبطاقات SHEIN وتحويل اليوان والدولار وشحن المحافظ.",
      en: "Global bill payments, international transfers, SHEIN cards, yuan payments, dollar exchange, and wallet top-ups.",
    },
  },
  "/admissions": {
    canonicalPath: "/admissions",
    title: {
      ar: "طلب خدمة | الوسيط العالمي للحوالات",
      en: "Request a Service | Alwaseet Global",
    },
    description: {
      ar: "أرسل طلب خدمة دفع أو حوالة أو شحن محفظة وسيتواصل معك فريق الوسيط العالمي لتأكيد التفاصيل.",
      en: "Send a payment, transfer, or wallet top-up request and the Alwaseet team will confirm the details.",
    },
  },
  "/gallery": {
    canonicalPath: "/gallery",
    title: {
      ar: "معرض الصور | الوسيط العالمي للحوالات",
      en: "Gallery | Alwaseet Global",
    },
    description: {
      ar: "لمحات بصرية عن خدمات الدفع الإلكتروني والحوالات والشراء العالمي وشحن المحافظ.",
      en: "Visual overview of digital payments, transfers, global purchasing, and wallet top-up services.",
    },
  },
  "/news": {
    canonicalPath: "/news",
    title: {
      ar: "الأخبار والتحديثات | الوسيط العالمي للحوالات",
      en: "News and Updates | Alwaseet Global",
    },
    description: {
      ar: "آخر تحديثات خدمات الوسيط العالمي للحوالات والدفع الإلكتروني والشراء العالمي.",
      en: "Latest updates from Alwaseet Global money transfer, digital payment, and global purchasing services.",
    },
  },
  "/contact": {
    canonicalPath: "/contact",
    title: {
      ar: "تواصل معنا | الوسيط العالمي للحوالات",
      en: "Contact | Alwaseet Global",
    },
    description: {
      ar: "قنوات التواصل الرسمية لتأكيد السعر وتنفيذ عمليات التحويل والمدفوعات مع الوسيط العالمي.",
      en: "Official contact channels for confirming rates and transfer/payment operations with Alwaseet Global.",
    },
  },
};

export function getAbsoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const browserOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const root = (siteConfig.siteUrl || browserOrigin).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${root}${normalizedPath}`;
}
