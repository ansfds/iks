import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { SiteImage } from "@/components/SiteImage";
import { HomeGiftCardSwitch } from "@/components/gift-cards/HomeGiftCardSwitch";
import { SITE_IMAGES } from "@/config/site-images";
import {
  Star,
  Building2,
  Globe,
  Heart,
  ArrowRight,
  Quote,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function PerspectiveText({ text, isArabic = false }: { text: string; isArabic?: boolean }) {
  if (isArabic) {
    return (
      <h1
        dir="rtl"
        lang="ar"
        className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold text-white tracking-normal leading-tight"
        style={{
          letterSpacing: "0",
          fontKerning: "normal",
          textRendering: "optimizeLegibility",
        }}
      >
        {text}
      </h1>
    );
  }

  return (
    <h1 className="flex flex-wrap justify-center gap-1 perspective-800 preserve-3d">
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold text-white inline-block preserve-3d"
          style={{
            perspective: "10px",
            transform: "rotateY(6deg)",
            transformOrigin: "left center",
            animationDelay: `${i * 0.05}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </h1>
  );
}

function StarDecoration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`text-[#38BDF8] star-rotate ${className}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" />
    </svg>
  );
}

const legacyContentPattern =
  /school|student|teacher|classroom|campus|curriculum|admission|parent|grade|مدرس|طالب|طلاب|تعليم|منهج|مناهج|معلم|أولياء|الصف/i;

function hasLegacyContent(...values: Array<string | null | undefined>) {
  return values.some((value) => value ? legacyContentPattern.test(value) : false);
}

export default function Home() {
  const { t, dir } = useLanguage();

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const curriculumRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const { data: testimonialsData } = trpc.testimonial.list.useQuery();
  const { data: galleryData } = trpc.gallery.list.useQuery({});
  const mapsUrl = "https://maps.app.goo.gl/GE4p2GdUZd8o8v9DA";
  const publicTestimonials =
    testimonialsData?.filter(
      (testimonial) =>
        !hasLegacyContent(
          testimonial.quote,
          testimonial.quoteAr,
          testimonial.role,
          testimonial.roleAr
        )
    ) ?? [];
  const publicGalleryData =
    galleryData?.filter((item) => !hasLegacyContent(item.title, item.titleAr, item.description, item.descriptionAr)) ?? [];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroElements = heroRef.current?.querySelectorAll(".hero-animate");
      if (heroElements) {
        gsap.fromTo(
          heroElements,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.15 }
        );
      }

      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.querySelectorAll(".stat-item"),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1,
            scrollTrigger: { trigger: statsRef.current, start: "top 85%" } }
        );
      }

      [aboutRef, whyRef, curriculumRef, testimonialsRef, galleryRef, contactRef].forEach((ref) => {
        if (ref.current) {
          gsap.fromTo(
            ref.current.querySelectorAll("[class*='animate']"),
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.12,
              scrollTrigger: { trigger: ref.current, start: "top 80%" } }
          );
        }
      });
    });
    return () => ctx.revert();
  }, []);

  const stats = [
    { number: "+1.3K", label: t("stats.students") },
    { number: "6", label: t("stats.classrooms") },
    { number: "24/7", label: t("stats.nationalities") },
    { number: "100%", label: t("stats.satisfaction") },
  ];

  const features = [
    { icon: Star, title: t("why.character.title"), description: t("why.character.desc") },
    { icon: Building2, title: t("why.facilities.title"), description: t("why.facilities.desc") },
    { icon: Globe, title: t("why.global.title"), description: t("why.global.desc") },
    { icon: Heart, title: t("why.wellbeing.title"), description: t("why.wellbeing.desc") },
  ];

  const galleryImages = publicGalleryData.length ? publicGalleryData.slice(0, 9) : [
    { id: 1, imageUrl: SITE_IMAGES.gallery.paymentServices, title: "خدمات دفع إلكتروني" },
    { id: 2, imageUrl: SITE_IMAGES.gallery.transfers, title: "حوالات خارجية" },
    { id: 3, imageUrl: SITE_IMAGES.gallery.globalShopping, title: "شراء عالمي" },
    { id: 4, imageUrl: SITE_IMAGES.finance.transferHero, title: "بطاقات شحن" },
    { id: 5, imageUrl: SITE_IMAGES.gallery.currencyExchange, title: "صرف عملات" },
    { id: 6, imageUrl: SITE_IMAGES.finance.libyaCairo, title: "محافظ إلكترونية" },
    { id: 7, imageUrl: SITE_IMAGES.finance.transferHero, title: "مدفوعات اليوان" },
    { id: 8, imageUrl: SITE_IMAGES.finance.globalFinance, title: "دعم العملاء" },
    { id: 9, imageUrl: SITE_IMAGES.finance.libyaCairo, title: "معاملات آمنة" },
  ];

  return (
    <div dir={dir}>
      <section
        ref={heroRef}
        className="relative min-h-[100vh] max-h-[900px] flex items-center justify-center bg-gradient-hero overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(11,30,53,.86), rgba(33,59,111,.74)), url(${SITE_IMAGES.homepage.heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <StarDecoration className="absolute top-[15%] left-[10%] w-6 h-6 opacity-60" />
        <StarDecoration className="absolute top-[20%] left-[18%] w-8 h-8 opacity-40" />
        <StarDecoration className="absolute top-[12%] right-[15%] w-10 h-10 opacity-50" />
        <StarDecoration className="absolute top-[25%] right-[8%] w-5 h-5 opacity-70" />
        <StarDecoration className="absolute bottom-[25%] left-[12%] w-7 h-7 opacity-50" />
        <StarDecoration className="absolute bottom-[20%] right-[12%] w-9 h-9 opacity-40" />
        <StarDecoration className="absolute top-[40%] left-[5%] w-4 h-4 opacity-60" />
        <StarDecoration className="absolute bottom-[35%] right-[5%] w-6 h-6 opacity-50" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="hero-animate inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-white/[0.15] border border-white/20 mb-8">
            {t("hero.welcome")}
          </div>
          <div className="hero-animate mb-4">
            <PerspectiveText text="الوسيط العالمي للحوالات" isArabic />
          </div>
          <p className="hero-animate text-xl sm:text-2xl md:text-[28px] font-medium text-white/[0.85] mb-6">
            {t("hero.subtitle")}
          </p>
          <p className="hero-animate text-base md:text-lg text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
            {t("hero.description")}
          </p>
          <div className={`hero-animate flex flex-col sm:flex-row items-center justify-center gap-4 ${dir === "rtl" ? "sm:flex-row-reverse" : ""}`}>
            <Link to="/admissions" className="btn-primary glow-pulse">{t("hero.cta.primary")}</Link>
            <Link to="/about" className="btn-secondary">{t("hero.cta.secondary")}</Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section ref={statsRef} className="bg-white py-10 md:py-12">
        <div className="container-main px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {stats.map((stat, i) => (
              <div key={i} className={`stat-item text-center ${i < stats.length - 1 ? "md:border-r md:border-gray-100" : ""}`}>
                <div className="text-3xl md:text-[42px] font-bold text-[#7A1E2A] mb-1">{stat.number}</div>
                <div className="text-sm text-[#7C7C7C]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeGiftCardSwitch />

      <section ref={aboutRef} className="bg-[#F8F9FA] section-padding">
        <div className="container-main">
          <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${dir === "rtl" ? "lg:direction-rtl" : ""}`}>
            <div className={dir === "rtl" ? "lg:order-2" : ""}>
              <span className="about-animate inline-block text-sm font-semibold text-[#7A1E2A] uppercase tracking-wider mb-3">{t("about.label")}</span>
              <h2 className="about-animate text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1A1A1A] leading-tight mb-6">{t("about.title")}</h2>
              <p className="about-animate text-base text-[#7C7C7C] leading-relaxed mb-6">{t("about.body")}</p>
              <Link to="/about" className="about-animate inline-flex items-center gap-2 text-[#7A1E2A] font-medium hover:gap-3 transition-all">
                {t("about.learnMore")}
                <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
              </Link>
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <SiteImage
                src={SITE_IMAGES.homepage.aboutImage}
                fallbackSrc={SITE_IMAGES.finance.fallbackLibyaCairo}
                alt="خدمات تحويل من ليبيا إلى مصر"
                className="about-animate w-full max-h-[560px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section ref={whyRef} className="bg-white section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">{t("why.title")}</h2>
            <p className="text-base md:text-lg text-[#7C7C7C] max-w-2xl mx-auto">{t("why.subtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="why-card card-shadow bg-white border border-[rgba(11,30,53,0.08)] p-8">
                <feature.icon size={48} className="text-[#7A1E2A] mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">{feature.title}</h3>
                <p className="text-base text-[#7C7C7C] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={curriculumRef} className="bg-gradient-curriculum section-padding">
        <div className="container-main">
          <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${dir === "rtl" ? "lg:direction-rtl" : ""}`}>
            <div className={dir === "rtl" ? "lg:order-2" : ""}>
              <SiteImage
                src={SITE_IMAGES.homepage.servicesImage}
                fallbackSrc={SITE_IMAGES.finance.fallbackTransferHero}
                alt="حوالات ومدفوعات عالمية من الوسيط العالمي"
                className="curriculum-animate w-full max-h-[560px]"
              />
            </div>
            <div className={dir === "rtl" ? "lg:order-1" : ""}>
              <h2 className="curriculum-animate text-3xl md:text-[42px] font-bold text-white mb-6">{t("curriculum.title")}</h2>
              <p className="curriculum-animate text-base md:text-lg text-white/80 leading-relaxed mb-8">{t("curriculum.description")}</p>
              <Link to="/curriculum" className="curriculum-animate inline-flex items-center px-8 py-3.5 bg-white text-[#7A1E2A] font-medium rounded-md hover:bg-white/90 transition-colors">
                {t("curriculum.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership section removed */}

      <section ref={testimonialsRef} className="bg-[#F8F9FA] section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
              ماذا يقول عملاؤنا
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {publicTestimonials.slice(0, 3).map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card bg-white rounded-lg p-8 shadow-sm">
                <Quote size={32} className="text-[#7A1E2A]/20 mb-4" />
                <p className="text-base text-[#1A1A1A] italic leading-relaxed mb-6">
                  {testimonial.quoteAr || "تجربة موثوقة مع متابعة واضحة حتى اكتمال الخدمة."}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-[#38BDF8] fill-[#38BDF8]" />
                  ))}
                </div>
                <div className="font-semibold text-[#1A1A1A]">
                  {testimonial.authorNameAr || "عميل الوسيط العالمي"}
                </div>
                <div className="text-sm text-[#7C7C7C]">
                  {testimonial.roleAr || "خدمات مالية"}
                </div>
              </div>
            ))}
            {publicTestimonials.length === 0 && [
              { quote: "تعامل واضح وسريع في تنفيذ الحوالة ومتابعة ممتازة حتى التأكيد النهائي.", authorName: "عميل من طرابلس", role: "حوالات خارجية", rating: 5 },
              { quote: "خدمة مفيدة جدًا للدفع من المواقع العالمية وشحن المحافظ الإلكترونية.", authorName: "عميلة دفع إلكتروني", role: "دفع إلكتروني", rating: 5 },
              { quote: "تأكيد التفاصيل قبل التنفيذ أعطاني ثقة وراحة في التعامل.", authorName: "عميل شراء عالمي", role: "شراء عالمي", rating: 5 },
            ].map((item, i) => (
              <div key={i} className="testimonial-card bg-white rounded-lg p-8 shadow-sm">
                <Quote size={32} className="text-[#7A1E2A]/20 mb-4" />
                <p className="text-base text-[#1A1A1A] italic leading-relaxed mb-6">{item.quote}</p>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(item.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-[#38BDF8] fill-[#38BDF8]" />
                  ))}
                </div>
                <div className="font-semibold text-[#1A1A1A]">{item.authorName}</div>
                <div className="text-sm text-[#7C7C7C]">{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={galleryRef} className="bg-white section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">{t("gallery.title")}</h2>
            <p className="text-base md:text-lg text-[#7C7C7C] max-w-2xl mx-auto">{t("gallery.subtitle")}</p>
          </div>
          <div className="hidden md:flex justify-center mb-10">
            <div className="grid grid-cols-3 gap-2 preserve-3d" style={{ perspective: "1200px", transform: "perspective(1200px) rotateX(20deg) rotateZ(-10deg)", maxWidth: "600px" }}>
              {galleryImages.map((img) => (
                <div key={img.id} className="gallery-item preserve-3d transition-transform duration-400 hover:scale-105" style={{ transform: "translateZ(0)", transition: "transform 0.4s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateZ(40px) scale(1.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateZ(0) scale(1)"; }}>
                  <SiteImage
                    src={img.imageUrl}
                    fallbackSrc={SITE_IMAGES.finance.fallbackTransferHero}
                    alt="صورة من خدمات الوسيط العالمي"
                    className="w-full aspect-square"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="md:hidden grid grid-cols-2 gap-3 mb-8">
            {galleryImages.slice(0, 6).map((img) => (
              <div key={img.id} className="gallery-item">
                <SiteImage
                  src={img.imageUrl}
                  fallbackSrc={SITE_IMAGES.finance.fallbackTransferHero}
                  alt="صورة من خدمات الوسيط العالمي"
                  className="w-full aspect-[3/4]"
                />
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/gallery" className="btn-outline">{t("gallery.cta")}</Link>
          </div>
        </div>
      </section>

      <section ref={contactRef} className="bg-[#171923] section-padding">
        <div className="container-main text-center">
          <h2 className="contact-animate text-3xl md:text-[42px] font-bold text-white mb-4">{t("contactcta.title")}</h2>
          <p className="contact-animate text-base md:text-lg text-white/70 max-w-2xl mx-auto mb-10">{t("contactcta.description")}</p>
          <div className={`contact-animate flex flex-col sm:flex-row items-center justify-center gap-4 ${dir === "rtl" ? "sm:flex-row-reverse" : ""}`}>
            <Link to="/contact" className="btn-primary">{t("contactcta.contact")}</Link>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary">{t("contactcta.visit")}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
