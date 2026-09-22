import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { Target, Eye, Lightbulb, Heart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function VisionMission() {
  const { t, dir } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".vm-animate"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
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

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.vision")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.vision")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef} className="bg-white section-padding">
        <div className="container-main">
          {/* Vision Block */}
          <div
            className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 ${
              dir === "rtl" ? "lg:direction-rtl" : ""
            }`}
          >
            <div className={dir === "rtl" ? "lg:order-2" : ""}>
              <div className="vm-animate flex items-center gap-3 mb-4">
                <Eye size={28} className="text-[#1D7FEA]" />
                <span className="text-sm font-semibold text-[#213B6F] uppercase tracking-wider">
                  رؤيتنا
                </span>
              </div>
              <h2 className="vm-animate text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                أن نكون شريكًا ماليًا موثوقًا في الدفع الإلكتروني والحوالات والشراء العالمي
              </h2>
              <p className="vm-animate text-base text-[#7C7C7C] leading-relaxed">
                {t("about.vision.text")}
              </p>
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <img
                src="/images/alwaseet-global-finance.jpg"
                alt="شبكة حوالات ومدفوعات عالمية"
                className="vm-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>

          {/* Mission Block */}
          <div
            className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
              dir === "rtl" ? "lg:direction-rtl" : ""
            }`}
          >
            <div className={dir === "rtl" ? "lg:order-2" : ""}>
              <img
                src="/images/alwaseet-libya-cairo.jpg"
                alt="خدمات الوسيط العالمي للتحويلات"
                className="vm-animate rounded-lg shadow-lg w-full object-contain aspect-[3/4] max-h-[560px] bg-[#EEF6FF] p-2"
              />
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <div className="vm-animate flex items-center gap-3 mb-4">
                <Target size={28} className="text-[#213B6F]" />
                <span className="text-sm font-semibold text-[#213B6F] uppercase tracking-wider">
                  رسالتنا
                </span>
              </div>
              <h2 className="vm-animate text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                {t("about.mission.text")}
              </h2>

              <div className="space-y-4">
                {[
                  {
                    icon: Lightbulb,
                    title: "دقة التنفيذ",
                    desc: "تأكيد التفاصيل والعملة والوجهة قبل تنفيذ أي دفعة أو حوالة",
                  },
                  {
                    icon: Heart,
                    title: "عناية العملاء",
                    desc: "تواصل مباشر ومتابعة واضحة حتى اكتمال الخدمة",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="vm-animate flex items-start gap-4 p-4 bg-[#F8F9FA] rounded-lg"
                  >
                    <item.icon
                      size={24}
                      className="text-[#213B6F] mt-0.5 shrink-0"
                    />
                    <div>
                      <h3 className="font-semibold text-[#1A1A1A] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#7C7C7C]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
