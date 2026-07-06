import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteImages } from "@/config/site";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  Handshake,
  Lightbulb,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
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

  const backgroundParagraphs = isArabic
    ? [
        "تأسست مدرسة المعرفة الدولية (IKS) عام 2010، وهي مؤسسة تعليمية متميزة معتمدة من إدارة التعليم الأجنبي بوزارة التربية والتعليم الليبية.",
        "انطلقت المدرسة من مبدأ ربط القيم التعليمية المحلية بالمعايير الدولية، لتلبية متطلبات عالم متغير ومترابط.",
        "ومع إدراك أهمية اللغة الإنجليزية كلغة محورية للتواصل الدولي، قدمت المدرسة قسمين متكاملين: القسم المحلي والقسم الدولي البريطاني/الأمريكي.",
        "تهدف المدرسة إلى تعزيز التميز الأكاديمي وتزويد الطلاب بكفاءة لغوية قوية، وخاصة في اللغة الإنجليزية، لتمكينهم من التواصل والنجاح في عالم اليوم.",
      ]
    : [
        "International Knowledge School (IKS), established in 2010, is a distinguished educational institution approved by the Department of Foreign Education within the Libyan Ministry of Education.",
        "Founded on the principle of bridging local educational values with international standards, the school was designed to meet the evolving demands of a globalized world.",
        "Recognizing that English has become a cornerstone for international communication, IKS introduced two distinct departments - Local and International (British/American) - to provide diverse yet complementary educational experiences.",
        "The school's foundational goal is to promote academic excellence while equipping students with strong language proficiency, particularly in English, enabling them to communicate and succeed effectively in today's interconnected world.",
      ];

  const mission = isArabic
    ? "تركز رسالتنا على بناء مجتمع من المتعلمين النشطين الملتزمين بالنمو الشخصي في الجوانب الأخلاقية والعقلية والاجتماعية والنفسية والبدنية. تلتزم مدرسة المعرفة الدولية بتوفير بيئة آمنة وشاملة وقوية أكاديميًا، تهيئ الطلاب للفرص العالمية عبر المناهج البريطانية والأمريكية والوطنية، مع الالتزام بمعايير الجودة الوطنية والدولية."
    : "Our mission focuses on cultivating a community of active learners dedicated to personal growth across moral, mental, social, psychological, and physical dimensions. International Knowledge School is committed to providing a safe, inclusive, and academically rigorous environment that prepares students for global opportunities through the British, American, and National curricula, while maintaining compliance with national and international quality standards.";

  const vision = isArabic
    ? "تتمثل رؤيتنا في أن نصبح مؤسسة تعليمية رائدة تسهم بفاعلية في التطور الفكري والاجتماعي في ليبيا. وتهدف مدرسة المعرفة الدولية إلى ترسيخ مكانتها كمركز رائد للتميز الأكاديمي في ليبيا من خلال تقديم تعليم بريطاني وأمريكي عالي الجودة، وتحقيق معايير الاعتماد الدولية عبر التحسين المستمر والابتكار والتعلم المتمحور حول الطالب والتميز الأكاديمي."
    : "Our vision is to become a leading educational institution that contributes meaningfully to Libya's intellectual and social development. International Knowledge School aims to establish itself as a leading center of academic excellence in Libya by delivering high-quality British and American education while achieving international accreditation standards through continuous improvement, innovation, student-centered learning, and academic excellence.";

  const values = [
    {
      icon: Medal,
      title: isArabic ? "الجودة" : "Quality",
      desc: isArabic
        ? "نلتزم بمعايير تعليمية وتشغيلية عالية في كل تجربة مدرسية."
        : "We commit to high academic and operational standards across every school experience.",
    },
    {
      icon: Lightbulb,
      title: isArabic ? "الابتكار" : "Innovation",
      desc: isArabic
        ? "نطور أساليب التعلم ونشجع التفكير الجديد والحلول العملية."
        : "We improve learning methods and encourage fresh thinking and practical solutions.",
    },
    {
      icon: Handshake,
      title: isArabic ? "خدمة المجتمع" : "Community Service",
      desc: isArabic
        ? "نغرس المسؤولية ونبني علاقة إيجابية بين المدرسة والمجتمع."
        : "We cultivate responsibility and build a positive relationship between school and community.",
    },
    {
      icon: Eye,
      title: isArabic ? "الشفافية" : "Transparency",
      desc: isArabic
        ? "نؤمن بالوضوح والثقة في التواصل واتخاذ القرار."
        : "We believe in clarity and trust in communication and decision-making.",
    },
    {
      icon: Users,
      title: isArabic ? "العمل الجماعي" : "Teamwork",
      desc: isArabic
        ? "ننجح من خلال التعاون بين الطلاب والمعلمين والأسر والإدارة."
        : "We succeed through collaboration among students, teachers, families, and leadership.",
    },
  ];

  const visionPoints = isArabic
    ? ["التحسين المستمر", "الابتكار", "التعلم المتمحور حول الطالب", "التميز الأكاديمي"]
    : ["Continuous improvement", "Innovation", "Student-centered learning", "Academic excellence"];

  return (
    <div dir={dir}>
      <section className="relative min-h-[64vh] flex items-center overflow-hidden">
        <img
          src={siteImages.studentsGroup}
          alt="International Knowledge School students"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171923]/[0.93] via-[#3A0B12]/[0.72] to-[#7A1E2A]/[0.38]" />
        <div className="relative z-10 container-main px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-[#F0B736]">
              <Link to="/" className="hover:text-white transition-colors">
                {t("nav.home")}
              </Link>
              <span>/</span>
              <span>{t("page.about")}</span>
            </div>
            <h1 className="text-4xl md:text-[58px] font-bold text-white leading-tight mb-6">
              {isArabic ? "عن مدرسة المعرفة الدولية" : "About International Knowledge School"}
            </h1>
            <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-2xl">
              {isArabic
                ? "مؤسسة تعليمية دولية في ليبيا تجمع بين القيم المحلية والمعايير الأكاديمية العالمية."
                : "An international school in Libya bridging local educational values with global academic standards."}
            </p>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
              <div className="about-section-animate">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7A1E2A] mb-3">
                  {isArabic ? "الخلفية" : "Background"}
                </p>
                <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6 leading-tight">
                  {isArabic ? "مدرسة بنيت للتميز المحلي والعالمي" : "A school built for local and global excellence"}
                </h2>
                <div className="space-y-4 text-base text-[#5F6368] leading-relaxed">
                  {backgroundParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="about-section-animate relative">
                <img
                  src={siteImages.campus}
                  alt="International Knowledge School campus"
                  className="rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                  loading="lazy"
                />
                <div className="absolute -bottom-5 left-5 right-5 rounded-lg bg-white p-5 shadow-[0_16px_40px_rgba(23,25,35,0.16)] border border-[#7A1E2A]/10">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={28} className="text-[#7A1E2A] shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-[#1A1A1A]">
                        {isArabic ? "تأسست عام 2010" : "Established in 2010"}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {isArabic ? "معتمدة من إدارة التعليم الأجنبي" : "Approved by the Department of Foreign Education"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
              <article className="about-section-animate rounded-lg bg-[#171923] p-8 md:p-10 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7A1E2A]/30 to-transparent" />
                <div className="relative">
                  <Target size={40} className="text-[#F0B736] mb-6" strokeWidth={1.7} />
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F0B736] mb-3">
                    {isArabic ? "رسالتنا" : "Our Mission"}
                  </p>
                  <h2 className="text-3xl font-bold mb-5">
                    {isArabic ? "بيئة آمنة، شاملة، وطموحة" : "Safe, inclusive, and ambitious learning"}
                  </h2>
                  <p className="text-base leading-relaxed text-white/[0.76]">{mission}</p>
                </div>
              </article>

              <div className="about-section-animate grid gap-4">
                {[
                  {
                    icon: BookOpen,
                    title: isArabic ? "المناهج البريطانية والأمريكية والوطنية" : "British, American, and National Curricula",
                    desc: isArabic
                      ? "مسارات تعليمية متعددة ضمن مجتمع مدرسي واحد."
                      : "Multiple learning pathways within one school community.",
                  },
                  {
                    icon: Sparkles,
                    title: isArabic ? "Personal Growth" : "Personal Growth",
                    desc: isArabic
                      ? "رعاية النمو الأخلاقي والعقلي والاجتماعي والنفسي والبدني."
                      : "Supporting moral, mental, social, psychological, and physical development.",
                  },
                  {
                    icon: CheckCircle2,
                    title: isArabic ? "Quality Standards" : "Quality Standards",
                    desc: isArabic
                      ? "التزام بمعايير الجودة الوطنية والدولية."
                      : "Compliance with national and international quality standards.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-lg bg-white p-6 border border-[#7A1E2A]/10 shadow-sm"
                  >
                    <item.icon size={28} className="text-[#7A1E2A] mb-4" strokeWidth={1.7} />
                    <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                    <p className="text-sm text-[#5F6368] leading-relaxed">{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <p className="about-section-animate text-sm font-semibold uppercase tracking-[0.12em] text-[#7A1E2A] mb-3">
                {isArabic ? "قيمنا الأساسية" : "Our Core Values"}
              </p>
              <h2 className="about-section-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {isArabic ? "قيم تقود ثقافتنا المدرسية" : "Values that guide our school culture"}
              </h2>
              <p className="about-section-animate text-base text-[#6B7280]">
                {isArabic
                  ? "القيم الأساسية تظهر في طريقة التعليم والتواصل واتخاذ القرار داخل المدرسة."
                  : "Our core values are reflected in how we teach, communicate, and make decisions."}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="about-section-animate rounded-lg border border-[#7A1E2A]/10 bg-[#F8F9FA] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_36px_rgba(122,30,42,0.13)]"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#7A1E2A]/10 text-[#7A1E2A]">
                    <value.icon size={26} strokeWidth={1.7} />
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{value.title}</h3>
                  <p className="text-sm text-[#5F6368] leading-relaxed">{value.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <img
                src={siteImages.graduation}
                alt="Graduating students at International Knowledge School"
                className="about-section-animate rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
              <div className="about-section-animate">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7A1E2A] mb-3">
                  {isArabic ? "رؤيتنا" : "Our Vision"}
                </p>
                <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6 leading-tight">
                  {isArabic ? "مركز رائد للتميز الأكاديمي في ليبيا" : "A leading center of academic excellence in Libya"}
                </h2>
                <p className="text-base text-[#5F6368] leading-relaxed mb-7">{vision}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {visionPoints.map((point) => (
                    <div
                      key={point}
                      className="flex items-center gap-3 rounded-md bg-white p-4 border border-[#7A1E2A]/10"
                    >
                      <CheckCircle2 size={18} className="text-[#7A1E2A] shrink-0" />
                      <span className="text-sm font-medium text-[#1A1A1A]">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#171923] section-padding">
          <div className="container-main text-center">
            <h2 className="about-section-animate text-3xl md:text-[42px] font-bold text-white mb-5">
              {isArabic ? "انضم إلى مجتمع مدرسة المعرفة الدولية" : "Join the International Knowledge School community"}
            </h2>
            <p className="about-section-animate text-base text-white/[0.68] max-w-2xl mx-auto mb-8">
              {isArabic
                ? "ابدأ رحلة تعليمية تجمع بين الطموح الأكاديمي والرعاية الشخصية والجاهزية العالمية."
                : "Begin a learning journey that combines academic ambition, personal care, and global readiness."}
            </p>
            <Link
              to="/admissions"
              className="about-section-animate inline-flex items-center gap-2 px-8 py-3.5 bg-[#7A1E2A] text-white font-medium rounded-md hover:bg-[#9A2D3A] transition-colors"
            >
              {t("hero.cta.primary")}
              <ArrowRight size={18} className={dir === "rtl" ? "rotate-180" : ""} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
