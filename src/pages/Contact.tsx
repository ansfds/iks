import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteConfig } from "@/config/site";
import { trpc } from "@/providers/trpc";
import {
  MapPin,
  Phone,
  Clock,
  Send,
  MessageCircle,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Contact() {
  const { language, t, dir } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const facebookUrl = "https://www.facebook.com/profile.php?id=61560408535771";
  const whatsappUrl = "https://wa.me/218935095091";
  const mapsUrl = "https://maps.app.goo.gl/GE4p2GdUZd8o8v9DA";
  const mapEmbedUrl =
    "https://www.google.com/maps?q=%D8%B2%D9%86%D8%A7%D8%AA%D8%A9%20%D9%85%D9%82%D8%A7%D8%A8%D9%84%20%D9%83%D9%8A%D8%A7%D9%86%20%D9%85%D9%88%D8%A8%D8%A7%D9%8A%D9%84%20%D8%B7%D8%B1%D8%A7%D8%A8%D9%84%D8%B3%20%D9%84%D9%8A%D8%A8%D9%8A%D8%A7&output=embed";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t("contact.form.success"));
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: () => {
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    submitMutation.mutate({
      studentName: formData.name,
      parentName: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: `الموضوع: ${formData.subject}\n\n${formData.message}`,
      language,
    });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".contact-animate"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
          }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const contactInfo = [
    {
      icon: MapPin,
      title: "العنوان",
      content: t("footer.address"),
      href: mapsUrl,
    },
    ...siteConfig.displayPhones.map((phone) => ({
      icon: Phone,
      title: "الهاتف",
      content: phone,
      href: `tel:${phone}`,
    })),
    {
      icon: Clock,
      title: t("footer.hoursTitle"),
      content: `${t("footer.hours.weekdays")}\n${t("footer.hours.thursday")}\n${t("footer.hours.friday")}`,
    },
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.contact")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.contact")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        {/* Contact Info Cards */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, i) => (
                <div
                  key={i}
                  className="contact-animate card-shadow bg-white border border-[rgba(11,30,53,0.08)] rounded-lg p-6 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#213B6F]/10 flex items-center justify-center mx-auto mb-4">
                    <info.icon size={24} className="text-[#213B6F]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
                    {info.title}
                  </h3>
                  {info.href ? (
                    <a
                      href={info.href}
                      target={info.href.startsWith("http") ? "_blank" : undefined}
                      rel={info.href.startsWith("http") ? "noreferrer" : undefined}
                      className="text-sm text-[#7C7C7C] hover:text-[#213B6F] transition-colors"
                    >
                      <span className="whitespace-pre-line">{info.content}</span>
                    </a>
                  ) : (
                    <p className="whitespace-pre-line text-sm text-[#7C7C7C]">{info.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form + Map */}
        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 ${
                dir === "rtl" ? "lg:direction-rtl" : ""
              }`}
            >
              {/* Form */}
              <div className={dir === "rtl" ? "lg:order-2" : ""}>
                <h2 className="contact-animate text-2xl font-bold text-[#1A1A1A] mb-6">
                  {t("contact.form.title")}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder={`${t("contact.form.name")} *`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm bg-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder={`${t("contact.form.email")} *`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm bg-white"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t("contact.form.phone")}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder={t("contact.form.subject")}
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm bg-white"
                  />
                  <textarea
                    placeholder={`${t("contact.form.message")} *`}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-3 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm resize-none bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full h-12 bg-[#213B6F] text-white font-medium rounded-md hover:bg-[#2C4F8E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {submitMutation.isPending
                      ? "جاري الإرسال..."
                      : t("contact.form.submit")}
                  </button>
                </form>

                {/* Social */}
                <div className="mt-8">
                  <p className="text-sm text-[#7C7C7C] mb-3">
                    تابعنا على
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-[#213B6F] text-white flex items-center justify-center hover:bg-[#2C4F8E] transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook size={18} />
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#2C4F8E] px-4 text-sm font-medium text-white hover:bg-[#213B6F] transition-colors"
                    >
                      عرض الموقع
                    </a>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <div className="contact-animate bg-white rounded-lg shadow-sm overflow-hidden h-full min-h-[400px]">
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: "400px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="موقع الوسيط المعتمد"
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
