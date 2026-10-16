/// <reference types="vite/client" />
// ==============================
// إعدادات SEO والمشاركة
// ==============================
export const SITE_NAME = "الوسيط المعتمد";
export const SITE_NAME_EN = "ELWASEET EL-MOATAMAD";

// النطاق الموجود سابقًا في إعدادات sitemap. غيّره عبر VITE_SITE_URL عند الحاجة.
export const PROJECT_SITE_URL = "https://alwaseet-global.com";
export function validateSiteUrl(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (url.protocol !== "https:" || /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|::1)$/.test(host) || host.endsWith(".localhost") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("VITE_SITE_URL must be the public HTTPS site origin, without a path or localhost.");
  }
  return url.origin;
}
export const SITE_URL = validateSiteUrl(import.meta.env?.VITE_SITE_URL || (typeof process !== "undefined" ? process.env.VITE_SITE_URL : "") || PROJECT_SITE_URL);
export const DEFAULT_TITLE = "الوسيط المعتمد | الدفع الإلكتروني والتحويلات في ليبيا";
export const DEFAULT_DESCRIPTION = "الوسيط المعتمد في طرابلس، ليبيا للدفع الإلكتروني والتحويلات والكروت الرقمية Gift Cards. خدمات الدفع للمواقع العالمية والشراء أونلاين والخدمات الإلكترونية.";

// غيّر رابط صورة المشاركة من هذا السطر فقط. لا تغيّر الأبعاد إلا بعد التحقق منها.
export const DEFAULT_OG_IMAGE = "https://i.postimg.cc/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png";
export type SocialImage = { url: string; alt?: string; width?: number; height?: number; type?: string };
// هذه الأبعاد موثقة للصورة الأصلية فقط؛ تغيير الرابط لا يرث أبعادًا غير صحيحة.
const imageIdentity = new URL(DEFAULT_OG_IMAGE);
const verifiedDefaultImage = imageIdentity.hostname === "i.postimg.cc" && imageIdentity.pathname === "/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png";
export const DEFAULT_SOCIAL_IMAGE: SocialImage = { url: DEFAULT_OG_IMAGE, alt: "الوسيط المعتمد للدفع الإلكتروني والتحويلات في ليبيا", ...(verifiedDefaultImage ? { width: 1279, height: 720, type: "image/png" } : {}) };

export const seoKeywords = ["الوسيط المعتمد", "الدفع الإلكتروني ليبيا", "تحويلات مالية ليبيا", "طرابلس", "Gift Cards Libya", "الدفع للمواقع العالمية", "شراء أونلاين ليبيا", "تحويل يوان"];
export type SeoPage = {
  title: string;
  description: string;
  path: string;
  status: number;
  noindex?: boolean;
  image?: SocialImage;
  breadcrumbs?: Array<{ name: string; path: string }>;
};
const page = (path: string, title: string, description: string): SeoPage => ({ path, title, description, status: 200 });
export const pageSeo: Record<string, SeoPage> = {
  "/": page("/", DEFAULT_TITLE, DEFAULT_DESCRIPTION),
  "/about": page("/about", `عن ${SITE_NAME} | خدمات الدفع والتحويلات في ليبيا`, `تعرف على ${SITE_NAME} في طرابلس، ليبيا، وخدمات الدفع الإلكتروني والتحويلات الخارجية والشراء من الأسواق العالمية.`),
  "/curriculum": page("/curriculum", `خدمات الدفع الإلكتروني والشراء أونلاين | ${SITE_NAME}`, "دفع الفواتير والمواقع العالمية، تحويل اليوان الصيني، صرف الدولار وشحن المحافظ الإلكترونية من طرابلس، ليبيا."),
  "/gift-cards": page("/gift-cards", `الكروت الرقمية في ليبيا | ${SITE_NAME}`, "اختر كروت PlayStation وXbox وSHEIN الرقمية، وتعرّف على الفئات المتاحة والأسعار الحالية مع طلب مباشر عبر واتساب من ليبيا."),
  "/transfers": page("/transfers", `التحويلات والدفع الإلكتروني | ${SITE_NAME}`, "حسابات التحويل الرسمية وبيانات الدفع لدى الوسيط المعتمد في طرابلس، ليبيا. انسخ بيانات الحساب وتواصل لتأكيد تفاصيل التحويل."),
  "/contact": page("/contact", `تواصل معنا | ${SITE_NAME} في طرابلس`, "تواصل مع الوسيط المعتمد للدفع الإلكتروني والتحويلات: 0935095091 أو 0945095091. طرابلس، زناتة مقابل كيان موبايل، ليبيا."),
  "/admissions": page("/admissions", `طلب خدمة دفع أو تحويل | ${SITE_NAME}`, "أرسل تفاصيل طلب الدفع أو التحويل أو شحن المحفظة لفريق الوسيط المعتمد في ليبيا لمتابعة الطلب وتأكيد التفاصيل."),
  "/gallery": page("/gallery", `معرض خدمات الدفع والتحويلات | ${SITE_NAME}`, "صور خدمات الوسيط المعتمد للدفع الإلكتروني والتحويلات والشراء العالمي وشحن المحافظ في طرابلس، ليبيا."),
  "/news": page("/news", `أخبار الخدمات والكروت الرقمية | ${SITE_NAME}`, "تحديثات خدمات الوسيط المعتمد في ليبيا: المدفوعات والتحويلات والكروت الرقمية والخدمات الإلكترونية والشراء من المواقع العالمية."),
  "/vision-mission": page("/vision-mission", `الرؤية والرسالة | ${SITE_NAME}`, "رؤية ورسالة الوسيط المعتمد لخدمات دفع وتحويلات واضحة وموثوقة، ودعم المدفوعات والشراء العالمي للعملاء في ليبيا."),
  "/values": page("/values", `قيمنا في خدمات الدفع والتحويلات | ${SITE_NAME}`, "تعرف على قيم الوسيط المعتمد في الوضوح والموثوقية والمتابعة وخدمات الدفع الإلكتروني والتحويلات في ليبيا."),
  "/goals": page("/goals", `أهدافنا وخدماتنا الإلكترونية | ${SITE_NAME}`, "أهداف الوسيط المعتمد لتسهيل المدفوعات والتحويلات والشراء العالمي وتقديم الخدمات الإلكترونية للعملاء في طرابلس، ليبيا."),
};

// لتخصيص صورة مشاركة صفحة مستقبلًا: ضع هنا مسارها وصورة HTTPS الفعلية.
export const PAGE_SOCIAL_IMAGES: Record<string, SocialImage> = {};
const knownGiftCards: Record<string, string> = { playstation: "PlayStation", xbox: "Xbox", shein: "SHEIN" };
export function normalizeSeoPath(value: string) {
  const path = new URL(value, SITE_URL).pathname.replace(/\/{2,}/g, "/");
  return path === "/" ? "/" : path.replace(/\/$/, "");
}
export function absoluteSiteUrl(path: string, origin = SITE_URL) {
  return new URL(path, validateSiteUrl(origin)).href;
}
export function giftCardSlug(path: string) {
  return /^\/gift-cards\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(normalizeSeoPath(path))?.[1];
}
export function resolvePageSeo(value: string, options: {
  giftCard?: { displayName: string; slug: string; description?: string | null; status: string };
  notFound?: boolean;
  unavailable?: boolean;
} = {}): SeoPage {
  const path = normalizeSeoPath(value);
  if (options.unavailable) return { ...page(path, `تعذر تحميل الصفحة | ${SITE_NAME}`, "تعذر تحميل بيانات الصفحة مؤقتًا. يرجى إعادة المحاولة لاحقًا."), status: 503, noindex: true };
  if (options.notFound) return notFoundSeo(path);
  if (/^\/(admin|login|api|internal|dashboard|dev)(\/|$)/.test(path)) {
    return { ...page(path, `${path.startsWith("/login") ? "تسجيل الدخول" : "صفحة داخلية"} | ${SITE_NAME}`, "صفحة خاصة لإدارة خدمات الوسيط المعتمد."), noindex: true };
  }
  const slug = giftCardSlug(path);
  if (slug) {
    const card = options.giftCard;
    if (card?.status === "HIDDEN") return notFoundSeo(path);
    const name = (card?.displayName || knownGiftCards[slug] || slug).replace(/\s*(?:Store\s*)?Gift Cards?$/i, "").trim();
    return {
      ...page(path, `${name} Gift Cards في ليبيا | ${SITE_NAME}`, `كروت ${name} الرقمية لدى ${SITE_NAME} في ليبيا. اختر الفئة المناسبة وتعرّف على السعر الحالي، ثم تواصل عبر واتساب لتأكيد الطلب والدفع.`),
      noindex: card ? card.status !== "AVAILABLE" : !knownGiftCards[slug],
      image: PAGE_SOCIAL_IMAGES[path],
      breadcrumbs: [{ name: "الرئيسية", path: "/" }, { name: "الكروت الرقمية", path: "/gift-cards" }, { name, path }],
    };
  }
  const entry = pageSeo[path];
  return entry ? { ...entry, image: PAGE_SOCIAL_IMAGES[path], breadcrumbs: path === "/" ? undefined : [{ name: "الرئيسية", path: "/" }, { name: entry.title.split(" | ")[0], path }] } : notFoundSeo(path);
}
function notFoundSeo(path: string): SeoPage {
  return { ...page(path, `الصفحة غير موجودة (404) | ${SITE_NAME}`, "الصفحة المطلوبة غير موجودة. يمكنك العودة إلى الصفحة الرئيسية أو تصفح الخدمات والكروت الرقمية."), status: 404, noindex: true };
}
