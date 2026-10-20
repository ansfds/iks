import { trpc } from "@/providers/trpc";

export type SitePhone = { number: string; visible: boolean };
export type SiteHour = { label: string; hours: string };
const defaults: Record<string, string> = {
  site_name: "الوسيط المعتمد", site_name_en: "ELWASEET EL-MOATAMAD",
  site_address: "طرابلس - زناتة مقابل كيان موبايل",
  site_phones: JSON.stringify([{ number: "0935095091", visible: true }, { number: "0945095091", visible: true }]),
  site_whatsapp: "218935095091", site_gift_whatsapp: "218935095091",
  site_hours: JSON.stringify([{ label: "السبت - الأربعاء", hours: "11:00 - 19:00" }, { label: "الخميس", hours: "11:00 - 17:00" }, { label: "الجمعة", hours: "مغلق" }]),
  site_facebook: "https://www.facebook.com/profile.php?id=61560408535771",
  site_map_url: "https://maps.app.goo.gl/GE4p2GdUZd8o8v9DA",
  seo_og_image: "https://i.postimg.cc/pXZ1jZY9/bca0a88f-8c23-4525-abf6-8cca2061c6b4.png",
};

export function useSiteContent() {
  const query = trpc.siteContent.public.useQuery(undefined, { staleTime: 0, retry: 1, refetchInterval: 30_000 });
  const value = (key: string, fallback = "") => query.data?.[key] ?? defaults[key] ?? fallback;
  const isVisible = (key: string) => value(key, "true") !== "false";
  const phones = (): SitePhone[] => {
    try { const v = JSON.parse(value("site_phones")) as SitePhone[]; return v.filter(p => p.visible); }
    catch { return []; }
  };
  const hours = (): SiteHour[] => {
    try { return JSON.parse(value("site_hours")) as SiteHour[]; }
    catch { return []; }
  };
  return { value, isVisible, phones, hours, query };
}
