import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Contact() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

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
      toast.error(isArabic ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    submitMutation.mutate({
      studentName: formData.name,
      parentName: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: `Subject: ${formData.subject}\n\n${formData.message}`,
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
      title: isArabic ? "العنوان" : "Address",
      content: t("footer.address"),
    },
    {
      icon: Phone,
      title: isArabic ? "الهاتف" : "Phone",
      content: t("footer.phone"),
    },
    {
      icon: Mail,
      title: isArabic ? "البريد الإلكتروني" : "Email",
      content: t("footer.email"),
    },
    {
      icon: Clock,
      title: isArabic ? "ساعات العمل" : "Working Hours",
      content: isArabic
        ? "الأحد - الخميس: 7:30 ص - 3:30 م"
        : "Sunday - Thursday: 7:30 AM - 3:30 PM",
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
                  <div className="w-14 h-14 rounded-full bg-[#7A1E2A]/10 flex items-center justify-center mx-auto mb-4">
                    <info.icon size={24} className="text-[#7A1E2A]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">
                    {info.title}
                  </h3>
                  <p className="text-sm text-[#7C7C7C]">{info.content}</p>
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
                    className="w-full h-12 px-4 border border-[#F2D7DC] rounded-md focus:border-[#7A1E2A] focus:ring-2 focus:ring-[#7A1E2A]/10 outline-none transition-all text-sm bg-white"
                    required
                  />
                  <input
                    type="email"
                    placeholder={`${t("contact.form.email")} *`}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#F2D7DC] rounded-md focus:border-[#7A1E2A] focus:ring-2 focus:ring-[#7A1E2A]/10 outline-none transition-all text-sm bg-white"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t("contact.form.phone")}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#F2D7DC] rounded-md focus:border-[#7A1E2A] focus:ring-2 focus:ring-[#7A1E2A]/10 outline-none transition-all text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder={t("contact.form.subject")}
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full h-12 px-4 border border-[#F2D7DC] rounded-md focus:border-[#7A1E2A] focus:ring-2 focus:ring-[#7A1E2A]/10 outline-none transition-all text-sm bg-white"
                  />
                  <textarea
                    placeholder={`${t("contact.form.message")} *`}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    rows={5}
                    className="w-full px-4 py-3 border border-[#F2D7DC] rounded-md focus:border-[#7A1E2A] focus:ring-2 focus:ring-[#7A1E2A]/10 outline-none transition-all text-sm resize-none bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full h-12 bg-[#7A1E2A] text-white font-medium rounded-md hover:bg-[#9A2D3A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={16} />
                    {submitMutation.isPending
                      ? isArabic
                        ? "جاري الإرسال..."
                        : "Sending..."
                      : t("contact.form.submit")}
                  </button>
                </form>

                {/* Social */}
                <div className="mt-8">
                  <p className="text-sm text-[#7C7C7C] mb-3">
                    {isArabic ? "تابعنا على" : "Follow us on"}
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-[#7A1E2A] text-white flex items-center justify-center hover:bg-[#9A2D3A] transition-colors"
                    >
                      <Facebook size={18} />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-[#5B1420] text-white flex items-center justify-center hover:bg-[#7F1F2A] transition-colors"
                    >
                      <Instagram size={18} />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-[#9A2D3A] text-white flex items-center justify-center hover:bg-[#A63845] transition-colors"
                    >
                      <Twitter size={18} />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <Youtube size={18} />
                    </a>
                    <a
                      href="https://wa.me/966111234567"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <div className="contact-animate bg-white rounded-lg shadow-sm overflow-hidden h-full min-h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d181717.35044098078!2d13.278683135003627!3d32.748386490526954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x13a893edc718f48d%3A0xe4f1db59562c2a2b!2z2YXYr9ix2LPYqSDYp9mE2YXYudix2YHYqSDYp9mE2LnYp9mE2YXZitip!5e1!3m2!1sar!2sly!4v1782682222146!5m2!1sar!2sly"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: "400px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="School Location"
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
