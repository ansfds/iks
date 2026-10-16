import { SITE_IMAGES } from "./site-images";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_NAME_EN, SITE_URL, absoluteSiteUrl } from "./seo";

export const siteConfig = {
  name: SITE_NAME,
  shortName: SITE_NAME,
  alternateNames: [SITE_NAME_EN, "الوسيط المعتمد للدفع الإلكتروني والتحويلات"],
  siteUrl: SITE_URL,
  socialPreviewImage: DEFAULT_OG_IMAGE,
  email: "hosambizniz12@gmail.com",
  phone: "093-5095091",
  displayPhones: ["0935095091", "0945095091"],
  address: { street: "زناتة مقابل كيان موبايل", city: "طرابلس", country: "ليبيا", countryCode: "LY" },
  socialLinks: ["https://www.facebook.com/profile.php?id=61560408535771"] as string[],
};

export const siteImages = {
  socialPreview: DEFAULT_OG_IMAGE,
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
export { pageSeo, seoKeywords } from "./seo";
export const getAbsoluteUrl = absoluteSiteUrl;