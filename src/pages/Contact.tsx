import { Link } from "react-router";
import { useSiteContent } from "@/hooks/useSiteContent";
import { MapPin, Phone, Clock, MessageCircle, Facebook } from "lucide-react";

export default function Contact() {
  const cms = useSiteContent();
  const phones = cms.phones();
  const hours = cms.hours();
  const whatsapp = cms.value("site_whatsapp");
  const address = cms.value("site_address");
  const mapsUrl = cms.value("site_map_url");
  const facebook = cms.value("site_facebook");
  return <div dir="rtl" className="min-h-screen bg-slate-50">
    <section data-editor-section="contact-hero" data-editor-label="عنوان التواصل" className="relative flex min-h-[40vh] items-center justify-center bg-gradient-hero text-white"><div className="text-center">
      <h1 data-cms-key="contact_title" className="mb-3 text-4xl font-black md:text-5xl">{cms.value("contact_title","تواصل معنا")}</h1><p data-cms-key="contact_subtitle" className="text-white/80">{cms.value("contact_subtitle","نحن هنا لمساعدتك في خدمات الدفع والتحويلات")}</p>
      <Link to="/" className="mt-5 inline-block text-sm text-white/70 hover:text-white">الرئيسية / التواصل</Link>
    </div></section>
    <section className="container-main px-4 py-16"><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cms.isVisible("section_contact") && <>
        <Info title="العنوان" icon={<MapPin/>}><a href={mapsUrl} target="_blank" rel="noreferrer" className="hover:text-blue-800">{address}</a></Info>
        <Info title="أرقام الهاتف" icon={<Phone/>}>{phones.length ? phones.map(p=><a key={p.number} dir="ltr" className="block hover:text-blue-800" href={`tel:${p.number}`}>{p.number}</a>) : "لا توجد أرقام متاحة"}</Info>
        <Info title="ساعات العمل" icon={<Clock/>}>{hours.map((h,i)=><p key={i}>{h.label}: {h.hours}</p>)}</Info>
      </>}
    </div>
    <div data-editor-section="direct-contact" data-editor-label="التواصل المباشر" className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h2 data-cms-key="contact_direct_title" className="mb-3 text-2xl font-black">{cms.value("contact_direct_title","تواصل معنا مباشرة")}</h2>
      <p data-cms-key="contact_direct_description" className="mb-6 text-sm leading-7 text-slate-500">{cms.value("contact_direct_description","للاستفسار عن الدفع الإلكتروني، التحويلات، أو البطاقات الرقمية، راسلنا عبر واتساب.")}</p>
      <div className="flex flex-wrap justify-center gap-3"><a href={`https://wa.me/${whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"><MessageCircle size={19}/>واتساب</a>
        {facebook && <a href={facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-900"><Facebook size={18}/>فيسبوك</a>}</div>
    </div>
    </section>
  </div>;
}
function Info({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <article className="rounded-2xl border border-slate-100 bg-white p-7 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-900">{icon}</div>
    <h2 className="mb-3 font-black text-slate-900">{title}</h2><div className="text-sm leading-8 text-slate-600">{children}</div>
  </article>;
}
