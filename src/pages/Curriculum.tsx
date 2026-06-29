import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { Baby, BookOpen, Compass, GraduationCap } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Curriculum() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".curriculum-animate"),
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

  const stages = [
    {
      icon: Baby,
      title: t("curriculum.early.title"),
      ages: t("curriculum.early.ages"),
      desc: t("curriculum.early.desc"),
      color: "#7B2F63",
      borderColor: "border-[#7B2F63]",
    },
    {
      icon: BookOpen,
      title: t("curriculum.primary.title"),
      ages: t("curriculum.primary.ages"),
      desc: t("curriculum.primary.desc"),
      color: "#213B6F",
      borderColor: "border-[#213B6F]",
    },
    {
      icon: Compass,
      title: t("curriculum.lower.title"),
      ages: t("curriculum.lower.ages"),
      desc: t("curriculum.lower.desc"),
      color: "#2C4F8E",
      borderColor: "border-[#2C4F8E]",
    },
    {
      icon: GraduationCap,
      title: t("curriculum.upper.title"),
      ages: t("curriculum.upper.ages"),
      desc: t("curriculum.upper.desc"),
      color: "#0B1E35",
      borderColor: "border-[#0B1E35]",
    },
  ];

  const subjects = [
    isArabic ? "اللغة الإنجليزية" : "English",
    isArabic ? "الرياضيات" : "Mathematics",
    isArabic ? "العلوم" : "Science",
    isArabic ? "الدراسات الاجتماعية" : "Social Studies",
    isArabic ? "اللغة العربية" : "Arabic Language",
    isArabic ? "التربية الإسلامية" : "Islamic Studies",
    isArabic ? "الفنون" : "Art & Design",
    isArabic ? "التربية البدنية" : "Physical Education",
    isArabic ? "الحاسوب" : "Computing",
    isArabic ? "الموسيقى" : "Music",
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.curriculum")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.curriculum")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        {/* Overview */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <div
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                dir === "rtl" ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={dir === "rtl" ? "lg:order-2" : ""}>
                <h2 className="curriculum-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6">
                  {t("curriculum.page.title")}
                </h2>
                <p className="curriculum-animate text-base md:text-lg text-[#7C7C7C] leading-relaxed mb-6">
                  {t("curriculum.page.description")}
                </p>
                <div className="curriculum-animate flex items-center gap-3 px-5 py-3 bg-[#F8F9FA] rounded-lg">
                  <BookOpen size={20} className="text-[#213B6F]" />
                  <span className="text-sm font-medium text-[#213B6F]">
                    {t("curriculum.pearson")}
                  </span>
                </div>
              </div>
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <img
                  src="/images/science-lab.jpg"
                  alt="Science Lab"
                  className="curriculum-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stages */}
        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <h2 className="curriculum-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] text-center mb-12">
              {t("curriculum.stages.title")}
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className={`curriculum-animate bg-white rounded-lg border-t-4 ${stage.borderColor} p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${stage.color}15` }}
                  >
                    <stage.icon
                      size={24}
                      style={{ color: stage.color }}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: stage.color }}
                  >
                    {stage.ages}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-[#7C7C7C] leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Subjects */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <h2 className="curriculum-animate text-3xl font-bold text-[#1A1A1A] text-center mb-10">
              {isArabic ? "المواد الدراسية" : "Our Subjects"}
            </h2>
            <div className="curriculum-animate flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {subjects.map((subject, i) => (
                <span
                  key={i}
                  className="px-5 py-2.5 bg-[#F8F9FA] text-[#1A1A1A] text-sm font-medium rounded-full border border-[#D8E0F0] hover:bg-[#213B6F] hover:text-white hover:border-[#213B6F] transition-colors cursor-default"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
