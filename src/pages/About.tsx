import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function About() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".about-section-animate"),
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

  const missionPillars = [
    "Academic Excellence & Innovation",
    "Character Development & Leadership",
    "Global Citizenship & Cultural Awareness",
  ];

  const pillarsAr = [
    "التميز الأكاديمي والابتكار",
    "تنمية الشخصية والقيادة",
    "المواطنة العالمية والوعي الثقافي",
  ];

  return (
    <div dir={dir}>
      {/* Page Hero */}
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.about")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.about")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        {/* Mission Section */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <div
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                dir === "rtl" ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={dir === "rtl" ? "lg:order-2" : ""}>
                <h2 className="about-section-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6">
                  {t("about.mission.title")}
                </h2>
                <p className="about-section-animate text-base md:text-lg text-[#7C7C7C] leading-relaxed mb-8">
                  {t("about.mission.text")}
                </p>
                <ul className="space-y-3">
                  {(isArabic ? pillarsAr : missionPillars).map((pillar, i) => (
                    <li
                      key={i}
                      className="about-section-animate flex items-center gap-3 text-[#1A1A1A]"
                    >
                      <CheckCircle
                        size={20}
                        className="text-[#213B6F] shrink-0"
                      />
                      <span>{pillar}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <img
                  src="/images/hero-classroom.jpg"
                  alt="Classroom"
                  className="about-section-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                dir === "rtl" ? "lg:direction-rtl" : ""
              }`}
            >
              <div className={dir === "rtl" ? "lg:order-2" : ""}>
                <img
                  src="/images/campus-exterior.jpg"
                  alt="Campus"
                  className="about-section-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                />
              </div>
              <div className={dir === "rtl" ? "lg:order-1" : ""}>
                <h2 className="about-section-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6">
                  {t("about.vision.title")}
                </h2>
                <p className="about-section-animate text-base md:text-lg text-[#7C7C7C] leading-relaxed">
                  {t("about.vision.text")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="text-center mb-12">
              <h2 className="about-section-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {t("about.values.title")}
              </h2>
              <p className="about-section-animate text-base text-[#7C7C7C] max-w-2xl mx-auto">
                {t("about.values.description")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: t("about.values.integrity.title"),
                  desc: t("about.values.integrity.desc"),
                  color: "bg-[#213B6F]",
                },
                {
                  title: t("about.values.respect.title"),
                  desc: t("about.values.respect.desc"),
                  color: "bg-[#7B2F63]",
                },
                {
                  title: t("about.values.excellence.title"),
                  desc: t("about.values.excellence.desc"),
                  color: "bg-[#2C4F8E]",
                },
                {
                  title: t("about.values.innovation.title"),
                  desc: t("about.values.innovation.desc"),
                  color: "bg-[#0B1E35]",
                },
              ].map((value, i) => (
                <div
                  key={i}
                  className="about-section-animate card-shadow bg-white border border-[rgba(11,30,53,0.08)] rounded-lg overflow-hidden"
                >
                  <div className={`h-2 ${value.color}`} />
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                      {value.title}
                    </h3>
                    <p className="text-sm text-[#7C7C7C] leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0B1E35] section-padding">
          <div className="container-main text-center">
            <h2 className="about-section-animate text-3xl font-bold text-white mb-6">
              {isArabic
                ? "انضم إلى مجتمع المعرفة اليوم"
                : "Join the Knowledge  Community Today"}
            </h2>
            <Link
              to="/admissions"
              className="about-section-animate inline-flex items-center gap-2 px-8 py-3.5 bg-[#213B6F] text-white font-medium rounded-md hover:bg-[#2C4F8E] transition-colors"
            >
              {t("hero.cta.primary")}
              <ArrowRight
                size={18}
                className={dir === "rtl" ? "rotate-180" : ""}
              />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
