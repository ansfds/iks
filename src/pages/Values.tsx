import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, Users, Award, Zap, BookOpen, Heart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Values() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".value-animate"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
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

  const values = [
    {
      icon: Shield,
      title: t("about.values.integrity.title"),
      desc: t("about.values.integrity.desc"),
      color: "#7A1E2A",
    },
    {
      icon: Users,
      title: t("about.values.respect.title"),
      desc: t("about.values.respect.desc"),
      color: "#5B1420",
    },
    {
      icon: Award,
      title: t("about.values.excellence.title"),
      desc: t("about.values.excellence.desc"),
      color: "#9A2D3A",
    },
    {
      icon: Zap,
      title: t("about.values.innovation.title"),
      desc: t("about.values.innovation.desc"),
      color: "#171923",
    },
    {
      icon: BookOpen,
      title: isArabic ? "التعلم مدى الحياة" : "Lifelong Learning",
      desc: isArabic
        ? "نعزز حب المعرفة والاكتشاف المستمر طوال الحياة"
        : "We foster a love of knowledge and continuous discovery throughout life",
      color: "#7A1E2A",
    },
    {
      icon: Heart,
      title: isArabic ? "التعاطف والرعاية" : "Compassion & Care",
      desc: isArabic
        ? "نرعى بيئة داعمة حيث يشعر كل طالب بالتقدير والاحترام"
        : "We nurture a supportive environment where every student feels valued",
      color: "#5B1420",
    },
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.values")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.values")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef} className="bg-white section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="value-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
              {t("about.values.title")}
            </h2>
            <p className="value-animate text-base md:text-lg text-[#7C7C7C] max-w-2xl mx-auto">
              {t("about.values.description")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <div
                key={i}
                className="value-animate card-shadow bg-white border border-[rgba(11,30,53,0.08)] rounded-lg p-8 text-center"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: `${value.color}15` }}
                >
                  <value.icon
                    size={28}
                    style={{ color: value.color }}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">
                  {value.title}
                </h3>
                <p className="text-sm text-[#7C7C7C] leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
