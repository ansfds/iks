import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import {
  FileText,
  ClipboardCheck,
  MessageSquare,
  UserCheck,
  CheckCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Admissions() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    grade: "",
    message: "",
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t("contact.form.success"));
      setFormData({
        studentName: "",
        parentName: "",
        email: "",
        phone: "",
        grade: "",
        message: "",
      });
    },
    onError: () => {
      toast.error(isArabic ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "An error occurred. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.parentName || !formData.email || !formData.message) {
      toast.error(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    submitMutation.mutate({
      ...formData,
      language,
    });
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".admissions-animate"),
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

  const steps = [
    {
      icon: FileText,
      title: t("admissions.step1.title"),
      desc: t("admissions.step1.desc"),
      color: "#7B2F63",
    },
    {
      icon: ClipboardCheck,
      title: t("admissions.step2.title"),
      desc: t("admissions.step2.desc"),
      color: "#213B6F",
    },
    {
      icon: MessageSquare,
      title: t("admissions.step3.title"),
      desc: t("admissions.step3.desc"),
      color: "#2C4F8E",
    },
    {
      icon: UserCheck,
      title: t("admissions.step4.title"),
      desc: t("admissions.step4.desc"),
      color: "#0B1E35",
    },
  ];

  const documents = [
    t("admissions.doc1"),
    t("admissions.doc2"),
    t("admissions.doc3"),
    t("admissions.doc4"),
    t("admissions.doc5"),
    t("admissions.doc6"),
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.admissions")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.admissions")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        {/* Process Section */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="admissions-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {t("admissions.process.title")}
              </h2>
              <p className="admissions-animate text-base text-[#7C7C7C] max-w-2xl mx-auto">
                {t("admissions.process.subtitle")}
              </p>
            </div>

            {/* Timeline */}
            <div className="relative max-w-4xl mx-auto">
              {/* Line - Desktop */}
              <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-[#D8E0F0]" />

              <div className="grid md:grid-cols-4 gap-8">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="admissions-animate relative text-center"
                  >
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10"
                      style={{ backgroundColor: `${step.color}15` }}
                    >
                      <step.icon
                        size={32}
                        style={{ color: step.color }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div
                      className="text-2xl font-bold mb-2"
                      style={{ color: step.color }}
                    >
                      0{i + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[#7C7C7C] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 ${
                dir === "rtl" ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={dir === "rtl" ? "lg:order-2" : ""}>
                <h2 className="admissions-animate text-3xl font-bold text-[#1A1A1A] mb-4">
                  {t("admissions.requirements.title")}
                </h2>
                <p className="admissions-animate text-base text-[#7C7C7C] mb-8">
                  {t("admissions.requirements.subtitle")}
                </p>
                <ul className="space-y-4">
                  {documents.map((doc, i) => (
                    <li
                      key={i}
                      className="admissions-animate flex items-start gap-3"
                    >
                      <CheckCircle
                        size={20}
                        className="text-[#213B6F] mt-0.5 shrink-0"
                      />
                      <span className="text-base text-[#1A1A1A]">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Form */}
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <div className="admissions-animate bg-white rounded-lg p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-[#1A1A1A] mb-6">
                    {t("contact.form.title")}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      placeholder={isArabic ? "اسم الطالب *" : "Student Name *"}
                      value={formData.studentName}
                      onChange={(e) =>
                        setFormData({ ...formData, studentName: e.target.value })
                      }
                      className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder={isArabic ? "اسم ولي الأمر *" : "Parent Name *"}
                      value={formData.parentName}
                      onChange={(e) =>
                        setFormData({ ...formData, parentName: e.target.value })
                      }
                      className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm"
                      required
                    />
                    <input
                      type="email"
                      placeholder={isArabic ? "البريد الإلكتروني *" : "Email *"}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm"
                      required
                    />
                    <input
                      type="tel"
                      placeholder={isArabic ? "الهاتف" : "Phone"}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm"
                    />
                    <input
                      type="text"
                      placeholder={isArabic ? "الصف المتقدم له" : "Grade Applying For"}
                      value={formData.grade}
                      onChange={(e) =>
                        setFormData({ ...formData, grade: e.target.value })
                      }
                      className="w-full h-12 px-4 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm"
                    />
                    <textarea
                      placeholder={isArabic ? "الرسالة *" : "Message *"}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-[#D8E0F0] rounded-md focus:border-[#213B6F] focus:ring-2 focus:ring-[#213B6F]/10 outline-none transition-all text-sm resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="w-full h-12 bg-[#213B6F] text-white font-medium rounded-md hover:bg-[#2C4F8E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {submitMutation.isPending
                        ? isArabic
                          ? "جاري الإرسال..."
                          : "Sending..."
                        : t("contact.form.submit")}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
