import { Facebook, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";

type SocialLink = {
  id: number;
  platform: string;
  label: string | null;
  url: string;
};

type Settings = Record<string, string>;

function getSocialIcon(platform: string) {
  const normalized = platform.toLowerCase();
  if (normalized.includes("facebook")) return Facebook;
  if (normalized.includes("instagram")) return Instagram;
  if (normalized.includes("whatsapp") || normalized.includes("telegram")) {
    return MessageCircle;
  }
  return MessageCircle;
}

export function ContactBand({
  settings,
  socialLinks,
}: {
  settings: Settings;
  socialLinks: SocialLink[];
}) {
  const phone = settings.phone ?? "";
  const whatsapp = settings.whatsapp ?? "";
  const address = settings.address ?? "";

  return (
    <section id="contact" className="bg-white py-14 sm:py-20" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg bg-slate-950 p-6 text-white sm:p-8">
            <p className="mb-3 text-sm font-bold text-cyan-300">تواصل معنا</p>
            <h2 className="text-3xl font-black sm:text-4xl">
              فريق الوسيط المعتمد جاهز لتأكيد السعر وتنفيذ العملية
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              كل قنوات التواصل هنا تُدار من لوحة الإدارة، ويمكن تحديثها بدون
              تعديل الكود.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-3 rounded-md bg-white p-4 font-bold text-slate-900 shadow-sm transition hover:text-blue-700"
                >
                  <Phone className="h-5 w-5 text-blue-700" />
                  {phone}
                </a>
              )}
              {whatsapp && (
                <a
                  href={whatsapp.startsWith("http") ? whatsapp : `https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-md bg-white p-4 font-bold text-slate-900 shadow-sm transition hover:text-emerald-700"
                >
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  WhatsApp
                </a>
              )}
              {address && (
                <div className="flex items-center gap-3 rounded-md bg-white p-4 font-bold text-slate-900 shadow-sm">
                  <MapPin className="h-5 w-5 text-blue-700" />
                  {address}
                </div>
              )}
            </div>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map((link) => {
                  const Icon = getSocialIcon(link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                    >
                      <Icon size={18} />
                      {link.label ?? link.platform}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
