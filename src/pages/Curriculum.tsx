import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { SiteImage } from "@/components/SiteImage";
import { SITE_IMAGES } from "@/config/site-images";
import { BookOpen } from "lucide-react";
import { ManagedServices } from "@/components/ManagedServices";
import { useSiteContent } from "@/hooks/useSiteContent";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Curriculum() {
  const { t, dir } = useLanguage();
  const cms = useSiteContent();
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
                <SiteImage
                  src={cms.value("services_image", SITE_IMAGES.finance.globalFinance)}
                  fallbackSrc={SITE_IMAGES.finance.fallbackGlobalFinance}
                  alt="خدمات دفع إلكتروني وتحويلات عالمية"
                  className="curriculum-animate h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {cms.isVisible("section_services") && <section className="bg-[#F8F9FA] section-padding"><div className="container-main"><h2 className="mb-10 text-center text-3xl font-bold">خدماتنا</h2><ManagedServices /></div></section>}
      </div>
    </div>
  );
}
