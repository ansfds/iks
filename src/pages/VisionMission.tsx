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
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
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
                <Eye size={28} className="text-[#5B1420]" />
                <span className="text-sm font-semibold text-[#7A1E2A] uppercase tracking-wider">
                  {isArabic ? "رؤيتنا" : "Our Vision"}
                </span>
              </div>
              <h2 className="vm-animate text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                {isArabic
                  ? "أن نكون مدرسة دولية رائدة معترفاً بها في التميز التعليمي والابتكار في التدريس والتنمية الشاملة للطلاب"
                  : "To be a leading international school recognized for excellence in education, innovation in teaching, and the holistic development of students"}
              </h2>
              <p className="vm-animate text-base text-[#7C7C7C] leading-relaxed">
                {t("about.vision.text")}
              </p>
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <img
                src="/images/students-group.jpg"
                alt="Students"
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
                src="/images/about-classroom.jpg"
                alt="Classroom"
                className="vm-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
              />
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <div className="vm-animate flex items-center gap-3 mb-4">
                <Target size={28} className="text-[#7A1E2A]" />
                <span className="text-sm font-semibold text-[#7A1E2A] uppercase tracking-wider">
                  {isArabic ? "رسالتنا" : "Our Mission"}
                </span>
              </div>
              <h2 className="vm-animate text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 leading-tight">
                {t("about.mission.text")}
              </h2>

              <div className="space-y-4">
                {[
                  {
                    icon: Lightbulb,
                    title: isArabic ? "التميز الأكاديمي" : "Academic Excellence",
                    desc: isArabic
                      ? "توفير تعليم عالمي المستوى يحفز الطلاب على التفكير النقدي والإبداع"
                      : "Providing world-class education that stimulates critical thinking and creativity",
                  },
                  {
                    icon: Heart,
                    title: isArabic ? "العناية الشخصية" : "Personal Care",
                    desc: isArabic
                      ? "توفير بيئة داعمة وآمنة يشعر فيها كل طالب بالتقدير والاحترام"
                      : "Providing a supportive and safe environment where every student feels valued",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="vm-animate flex items-start gap-4 p-4 bg-[#F8F9FA] rounded-lg"
                  >
                    <item.icon
                      size={24}
                      className="text-[#7A1E2A] mt-0.5 shrink-0"
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
