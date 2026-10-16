// ==============================
// صور الموقع
// ==============================
// غيّر الرابط ثم احفظ الملف. روابط HTTPS والمسارات المحلية مدعومة.
// للمعاينة الفورية شغّل npm run local وافتح http://localhost:4173/.
// نسخة الإنتاج (npm run preview/start) تحتاج npm run build بعد أي تعديل.
// الشعار محلي لأن الهوية المرفقة لا تملك رابط استضافة رسميًا بعد.
import { DEFAULT_OG_IMAGE } from "./seo";
const officialLogo = "/images/elwaseet-el-moatamad-logo.png";

export const SITE_IMAGES = {
  // الهوية: شعار الهيدر والتذييل وأيقونات المتصفح
  branding: {
    logo: officialLogo,
    navbarLogo: officialLogo,
    favicon: "/favicon.svg",
    appleTouchIcon: "/apple-touch-icon.png",
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    logoFallback: officialLogo,
    navbarLogoFallback: officialLogo,
    faviconFallback: "/favicon.svg",
  },

  // معاينة روابط الموقع عند مشاركتها
  seo: {
    // صورة المشاركة تُعدّل من DEFAULT_OG_IMAGE في ملف seo.ts فقط.
    socialPreview: DEFAULT_OG_IMAGE,
    socialPreviewFallback: officialLogo,
  },

  homepage: {
    // خلفية Hero أعلى الصفحة الرئيسية (تُعرض كخلفية cover)
    heroBackground:
      "https://i.postimg.cc/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png",
    // صورة «عن الوسيط المعتمد» في الصفحة الرئيسية
    aboutImage:
      "https://i.postimg.cc/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png",
    // صورة الخدمات في الصفحة الرئيسية
    servicesImage:
      "https://i.postimg.cc/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png",
  },

  // صور التحويلات والصفحات الداخلية وبدائلها المحلية
  finance: {
    transferHero:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=85",
    globalFinance:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1400&q=85",
    libyaCairo:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1400&q=85",
    fallbackTransferHero: "/images/alwaseet-transfer-hero.jpg",
    fallbackGlobalFinance: "/images/alwaseet-global-finance.jpg",
    fallbackLibyaCairo: "/images/alwaseet-libya-cairo.jpg",
  },

  // صور المعرض الافتراضية؛ صور Admin/Database لها الأولوية
  gallery: {
    paymentServices:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
    transfers:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1000&q=85",
    globalShopping:
      "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1000&q=85",
    currencyExchange:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1000&q=85",
  },
} as const;
