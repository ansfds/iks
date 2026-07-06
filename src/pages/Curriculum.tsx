import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteImages } from "@/config/site";
import { ArrowRight, Globe2, MapPinned, School } from "lucide-react";
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
          sectionRef.current.querySelectorAll(".curricula-card"),
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 82%",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const options = [
    {
      href: "/curriculum/international",
      image: siteImages.scienceLab,
      icon: Globe2,
      title: isArabic ? "المناهج الدولية" : "International Curricula",
      eyebrow: isArabic ? "British & American Pathways" : "British & American Pathways",
      description: isArabic
        ? "مسارات دولية معترف بها تشمل Pearson Edexcel، المنهج الأمريكي، التحضير لاختبار SAT، والإرشاد الجامعي."
        : "Recognized international pathways including Pearson Edexcel, American high school learning, SAT readiness, and university counseling.",
    },
    {
      href: "/curriculum/local",
      image: siteImages.aboutClassroom,
      icon: MapPinned,
      title: isArabic ? "المنهج المحلي" : "Local Curriculum",
      eyebrow: isArabic ? "Libyan National Curriculum" : "Libyan National Curriculum",
      description: isArabic
        ? "تعليم باللغة العربية متوافق مع المنهج الوطني الليبي، مع تعزيز اللغة الإنجليزية عبر Macmillan في الصفوف 1-8."
        : "Arabic-led learning aligned with the Libyan National Curriculum, strengthened by Macmillan English from Grades 1-8.",
    },
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[46vh] max-h-[480px] flex items-center justify-center overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-[0.18]">
          <img
            src={siteImages.library}
            alt="Students learning in the International Knowledge School library"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2B070D]/70 via-[#7A1E2A]/[0.72] to-[#171923]" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-white/90 text-sm font-medium mb-5">
            <School size={16} />
            {isArabic ? "اختر المسار الأنسب" : "Choose the right pathway"}
          </div>
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-4">
            {t("page.curriculum")}
          </h1>
          <p className="text-base md:text-lg text-white/[0.78] max-w-2xl mx-auto leading-relaxed">
            {isArabic
              ? "نظرة منظمة على مسارات مدرسة المعرفة الدولية، بين المناهج الدولية والمنهج المحلي."
              : "A clear gateway to International Knowledge School's international and local academic pathways."}
          </p>
        </div>
      </section>

      <section ref={sectionRef} className="bg-[#F8F9FA] section-padding">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {options.map((option) => (
              <Link
                key={option.href}
                to={option.href}
                className="curricula-card group relative min-h-[390px] md:min-h-[460px] overflow-hidden rounded-lg shadow-[0_18px_48px_rgba(23,25,35,0.16)] outline-none focus-visible:ring-4 focus-visible:ring-[#7A1E2A]/25"
                aria-label={option.title}
              >
                <img
                  src={option.image}
                  alt={`${option.title} at International Knowledge School`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171923]/[0.92] via-[#3A0B12]/[0.48] to-black/[0.12] transition-colors duration-500 group-hover:from-[#2B070D]/[0.94]" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-white/[0.14] text-white backdrop-blur-sm ring-1 ring-white/[0.18]">
                    <option.icon size={26} strokeWidth={1.7} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F0B736] mb-3">
                    {option.eyebrow}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {option.title}
                  </h2>
                  <p className="text-sm md:text-base leading-relaxed text-white/[0.78] max-w-xl mb-7">
                    {option.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-transform duration-300 group-hover:gap-3">
                    {isArabic ? "استكشف المسار" : "Explore pathway"}
                    <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
