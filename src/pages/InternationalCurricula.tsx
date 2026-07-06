import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteImages } from "@/config/site";
import {
  Award,
  Baby,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  CheckCircle2,
  Compass,
  Dumbbell,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  Monitor,
  School,
  Users,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function InternationalCurricula() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".international-animate"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.1,
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

  const pathways = [
    {
      icon: Award,
      title: isArabic ? "المنهج البريطاني" : "British Curriculum",
      image: siteImages.library,
      body: isArabic
        ? "تقدم مدرسة المعرفة الدولية منهجًا بريطانيًا شاملًا لجميع المراحل بالشراكة مع Pearson Edexcel، وفق المنهج الوطني البريطاني، ليحصل الطلاب على تعليم معترف به عالميًا."
        : "International Knowledge School delivers a comprehensive British curriculum for all grade levels in partnership with Pearson Edexcel, following the UK National Curriculum.",
      points: isArabic
        ? ["تعليم معترف به عالميًا", "اختبارات Pearson Edexcel داخل المدرسة", "تحضير قوي للجامعات والمسارات المهنية"]
        : ["Globally recognized education", "Pearson Edexcel examinations at school", "Strong university and career preparation"],
    },
    {
      icon: GraduationCap,
      title: isArabic ? "المنهج الأمريكي" : "American Curriculum",
      image: siteImages.graduation,
      body: isArabic
        ? "في المرحلة الثانوية، يقدم المسار الأمريكي من خلال Savvas Learning Company تعليمًا قائمًا على المعايير، مع تركيز واضح على التفكير النقدي والمهارات التحليلية والثقة الأكاديمية."
        : "At the high school level, the American curriculum is delivered through Savvas Learning Company, providing rigorous standards-based learning.",
      points: isArabic
        ? ["تنمية التفكير النقدي", "إتقان المواد والمهارات التحليلية", "تحضير منظم لاختبار SAT داخل المدرسة"]
        : ["Critical thinking and analytical skills", "Subject mastery and academic confidence", "Structured SAT preparation at school"],
    },
  ];

  const highlights = [
    {
      icon: Award,
      value: isArabic ? "Pearson Edexcel" : "Pearson Edexcel",
      label: isArabic ? "مركز اختبارات معترف به" : "Recognized Test Center",
    },
    {
      icon: School,
      value: isArabic ? "College Board" : "College Board",
      label: isArabic ? "مركز لاختبار SAT" : "SAT Test Center",
    },
    {
      icon: Globe2,
      value: isArabic ? "British + American" : "British + American",
      label: isArabic ? "مسارات دولية واضحة" : "Clear International Pathways",
    },
    {
      icon: Users,
      value: isArabic ? "University Ready" : "University Ready",
      label: isArabic ? "إرشاد جامعي ومهني" : "University and Career Counseling",
    },
  ];

  const stages = [
    {
      icon: Baby,
      title: isArabic ? "KG" : "KG",
      ages: isArabic ? "الأعمار 3-5" : "Ages 3-5",
      points: isArabic
        ? ["تعلم قائم على اللعب", "نمو اجتماعي", "مهارات قراءة وحساب مبكرة"]
        : ["Play-based learning", "Social development", "Early literacy and numeracy skills"],
    },
    {
      icon: BookOpen,
      title: isArabic ? "Primary" : "Primary",
      ages: isArabic ? "الأعمار 5-11" : "Ages 5-11",
      points: isArabic
        ? ["المراحل الأساسية 1-2", "الإنجليزية والرياضيات والعلوم", "إدخال مواد تخصصية"]
        : ["Key Stages 1-2", "English, Mathematics, and Science", "Introduction of specialist subjects"],
    },
    {
      icon: Compass,
      title: isArabic ? "Lower Secondary" : "Lower Secondary",
      ages: isArabic ? "الأعمار 11-14" : "Ages 11-14",
      points: isArabic
        ? ["المرحلة الأساسية 3", "تعلم مستقل", "معرفة قوية ومتوازنة بالمواد"]
        : ["Key Stage 3", "Independent learning", "Broad and balanced subject knowledge"],
    },
    {
      icon: GraduationCap,
      title: isArabic ? "Upper Secondary" : "Upper Secondary",
      ages: isArabic ? "الأعمار 14-18" : "Ages 14-18",
      points: isArabic
        ? ["IGCSEs وInternational A-Levels", "SAT والقبول الجامعي", "إرشاد جامعي ومهني"]
        : ["IGCSEs and International A-Levels", "SAT and university admission", "University and career counseling"],
    },
  ];

  const subjects = [
    { icon: Languages, name: isArabic ? "اللغة الإنجليزية" : "English" },
    { icon: Calculator, name: isArabic ? "الرياضيات" : "Mathematics" },
    { icon: Languages, name: isArabic ? "اللغة العربية" : "Arabic" },
    { icon: FlaskConical, name: isArabic ? "العلوم" : "Science" },
    { icon: Globe2, name: isArabic ? "الدراسات الاجتماعية" : "Social Studies" },
    { icon: BookOpen, name: isArabic ? "التربية الإسلامية" : "Islamic Studies" },
    { icon: Dumbbell, name: isArabic ? "التربية البدنية" : "Physical Education" },
    { icon: BookOpen, name: isArabic ? "القرآن الكريم" : "Quran" },
    { icon: Monitor, name: isArabic ? "الحاسوب" : "Computing" },
    { icon: Briefcase, name: isArabic ? "الأعمال" : "Business" },
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[64vh] flex items-center overflow-hidden">
        <img
          src={siteImages.scienceLab}
          alt="International curricula students learning in a science lab"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171923]/[0.92] via-[#3A0B12]/[0.76] to-[#7A1E2A]/[0.42]" />
        <div className="relative z-10 container-main px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-[#F0B736]">
              <Link to="/curriculum" className="hover:text-white transition-colors">
                {t("page.curriculum")}
              </Link>
              <span>/</span>
              <span>{isArabic ? "المناهج الدولية" : "International Curricula"}</span>
            </div>
            <h1 className="text-4xl md:text-[58px] font-bold text-white leading-tight mb-6">
              {isArabic ? "المناهج الدولية" : "International Curricula"}
            </h1>
            <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-2xl">
              {isArabic
                ? "قسم دولي يجمع بين المسارين البريطاني والأمريكي لإعداد الطلاب للتعليم العالي والفرص المستقبلية حول العالم."
                : "Internationally recognized British and American pathways designed to prepare students for higher education and future careers worldwide."}
            </p>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="international-animate grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7A1E2A] mb-3">
                  {isArabic ? "القسم الدولي" : "International Department"}
                </p>
                <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6 leading-tight">
                  {isArabic ? "تعليم عالمي بوضوح أكاديمي" : "Global education with academic clarity"}
                </h2>
                <p className="text-base md:text-lg text-[#5F6368] leading-relaxed">
                  {isArabic
                    ? "تقدم مدرسة المعرفة الدولية مسارات تعليمية دولية معترف بها، مصممة لبناء أساس أكاديمي قوي، وثقة لغوية، واستعداد حقيقي للجامعة والحياة المهنية."
                    : "International Knowledge School offers internationally recognized British and American educational pathways that build strong academic foundations, language confidence, and real readiness for university and career life."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {highlights.map((item) => (
                  <div
                    key={item.value}
                    className="rounded-lg border border-[#7A1E2A]/10 bg-[#F8F9FA] p-5"
                  >
                    <item.icon size={28} className="text-[#7A1E2A] mb-4" strokeWidth={1.7} />
                    <div className="text-lg font-bold text-[#1A1A1A]">{item.value}</div>
                    <div className="text-sm text-[#6B7280] mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="international-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {isArabic ? "المسارات الدولية" : "International Pathways"}
              </h2>
              <p className="international-animate text-base text-[#6B7280] leading-relaxed">
                {isArabic
                  ? "يعرض كل مسار تجربة تعليمية متكاملة، مع أدوات تقييم واعتماد تساعد الطلاب على الانتقال بثقة إلى المرحلة التالية."
                  : "Each pathway offers a complete learning experience with assessment and recognition tools that help students move confidently into the next stage."}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {pathways.map((pathway) => (
                <article
                  key={pathway.title}
                  className="international-animate overflow-hidden rounded-lg bg-white shadow-sm border border-[#7A1E2A]/10"
                >
                  <img
                    src={pathway.image}
                    alt={`${pathway.title} pathway at IKS`}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-6 md:p-8">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#7A1E2A]/10 text-[#7A1E2A]">
                      <pathway.icon size={26} strokeWidth={1.7} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">{pathway.title}</h3>
                    <p className="text-base text-[#5F6368] leading-relaxed mb-6">{pathway.body}</p>
                    <ul className="space-y-3">
                      {pathway.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm text-[#1A1A1A]">
                          <CheckCircle2 size={18} className="text-[#7A1E2A] mt-0.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="international-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {isArabic ? "المراحل التعليمية" : "Educational Stages"}
              </h2>
              <p className="international-animate text-base text-[#6B7280]">
                {isArabic
                  ? "تدرج تعليمي واضح من رياض الأطفال إلى المرحلة الثانوية العليا."
                  : "A clear learning progression from KG through Upper Secondary."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stages.map((stage) => (
                <article
                  key={stage.title}
                  className="international-animate rounded-lg border border-[#7A1E2A]/10 bg-white p-6 shadow-sm"
                >
                  <stage.icon size={32} className="text-[#7A1E2A] mb-4" strokeWidth={1.6} />
                  <p className="text-sm font-semibold text-[#9A2D3A] mb-2">{stage.ages}</p>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{stage.title}</h3>
                  <ul className="space-y-2">
                    {stage.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-[#5F6368]">
                        <Brain size={15} className="text-[#7A1E2A] mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#171923] section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="international-animate text-3xl md:text-[42px] font-bold text-white mb-4">
                {isArabic ? "المواد الدراسية" : "Our Subjects"}
              </h2>
              <p className="international-animate text-base text-white/[0.68]">
                {isArabic
                  ? "شبكة مواد متوازنة تدعم اللغة، العلوم، التكنولوجيا، الهوية، والجاهزية الجامعية."
                  : "A balanced subject grid supporting language, science, technology, identity, and university readiness."}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="international-animate rounded-md bg-white/[0.06] border border-white/10 p-4 text-center text-white transition-colors hover:bg-white/[0.1]"
                >
                  <subject.icon size={24} className="mx-auto mb-3 text-[#F0B736]" strokeWidth={1.7} />
                  <span className="text-sm font-medium">{subject.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
