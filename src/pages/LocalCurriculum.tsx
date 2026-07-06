import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { siteImages } from "@/config/site";
import {
  Award,
  Baby,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  Dumbbell,
  FlaskConical,
  Globe2,
  Languages,
  Medal,
  Monitor,
  School,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function LocalCurriculum() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".local-animate"),
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
  ];

  const subjects = [
    { icon: Languages, name: isArabic ? "اللغة الإنجليزية" : "English" },
    { icon: Calculator, name: isArabic ? "الرياضيات" : "Mathematics" },
    { icon: Languages, name: isArabic ? "اللغة العربية" : "Arabic" },
    { icon: FlaskConical, name: isArabic ? "العلوم" : "Science" },
    { icon: Globe2, name: isArabic ? "الدراسات الاجتماعية" : "Social Studies" },
    { icon: BookOpen, name: isArabic ? "التربية الإسلامية" : "Islamic Studies" },
    { icon: Dumbbell, name: isArabic ? "التربية البدنية" : "Physical Education" },
    { icon: Monitor, name: isArabic ? "الحاسوب" : "Computing" },
    { icon: BookOpen, name: isArabic ? "القرآن الكريم" : "Quran" },
  ];

  const bilingualPoints = isArabic
    ? [
        "تعليم باللغة العربية عبر جميع المواد الأساسية.",
        "إدخال منهج Macmillan للغة الإنجليزية من الصف الأول إلى الصف الثامن.",
        "انتقال الصف التاسع إلى منهج اللغة الإنجليزية الوطني الليبي استعدادًا لامتحانات الشهادة الإعدادية.",
      ]
    : [
        "Education is delivered primarily in Arabic across all core subjects.",
        "Macmillan English is introduced from Grades 1 through 8.",
        "Grade 9 transitions to the Libyan National English curriculum for National Middle School Examinations.",
      ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[64vh] flex items-center overflow-hidden">
        <img
          src={siteImages.aboutClassroom}
          alt="Local curriculum classroom at International Knowledge School"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#171923]/[0.92] via-[#3A0B12]/[0.72] to-[#7A1E2A]/[0.42]" />
        <div className="relative z-10 container-main px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-[#F0B736]">
              <Link to="/curriculum" className="hover:text-white transition-colors">
                {t("page.curriculum")}
              </Link>
              <span>/</span>
              <span>{isArabic ? "المنهج المحلي" : "Local Curriculum"}</span>
            </div>
            <h1 className="text-4xl md:text-[58px] font-bold text-white leading-tight mb-6">
              {isArabic ? "المنهج المحلي" : "Local Curriculum"}
            </h1>
            <p className="text-base md:text-xl text-white/80 leading-relaxed max-w-2xl">
              {isArabic
                ? "قسم محلي يقدم التعليم باللغة العربية، ويتوافق مع المنهج الوطني الليبي، مع تعزيز مبكر ومتدرج للغة الإنجليزية."
                : "A local department delivering Arabic-led education aligned with the Libyan National Curriculum and strengthened by structured English learning."}
            </p>
          </div>
        </div>
      </section>

      <div ref={sectionRef}>
        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="local-animate grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7A1E2A] mb-3">
                  {isArabic ? "القسم المحلي" : "Local Department"}
                </p>
                <h2 className="text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-6 leading-tight">
                  {isArabic ? "تعليم وطني بهوية قوية" : "National learning with a strong identity"}
                </h2>
                <div className="space-y-4 text-base md:text-lg text-[#5F6368] leading-relaxed">
                  <p>
                    {isArabic
                      ? "يقدم القسم المحلي التعليم باللغة العربية في معظم المواد، ويتوافق بشكل وثيق مع المنهج الوطني الليبي."
                      : "The Local Department delivers education primarily in Arabic across all subjects and aligns closely with the Libyan National Curriculum."}
                  </p>
                  <p>
                    {isArabic
                      ? "ولتعزيز أهمية الكفاءة ثنائية اللغة، تقدم مدرسة المعرفة الدولية اللغة الإنجليزية من خلال منهج Macmillan من الصف الأول حتى الصف الثامن."
                      : "To reinforce the importance of bilingual proficiency, International Knowledge School introduces English through the Macmillan curriculum from Grades 1 through 8."}
                  </p>
                </div>
              </div>
              <img
                src={siteImages.campus}
                alt="International Knowledge School campus for the local curriculum"
                className="rounded-lg shadow-lg w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div className="grid lg:grid-cols-3 gap-6">
              {bilingualPoints.map((point, index) => (
                <article
                  key={point}
                  className="local-animate rounded-lg bg-white p-6 border border-[#7A1E2A]/10 shadow-sm"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#7A1E2A]/10 text-[#7A1E2A]">
                    {index === 0 ? <School size={26} /> : index === 1 ? <Languages size={26} /> : <Award size={26} />}
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
                    {index === 0
                      ? isArabic
                        ? "تعلم عربي الأساس"
                        : "Arabic-Led Learning"
                      : index === 1
                      ? isArabic
                        ? "تعزيز اللغة الإنجليزية"
                        : "English Reinforcement"
                      : isArabic
                      ? "جاهزية للامتحانات الوطنية"
                      : "National Exam Alignment"}
                  </h3>
                  <p className="text-sm md:text-base text-[#5F6368] leading-relaxed">{point}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="local-animate relative overflow-hidden rounded-lg bg-[#171923] p-8 md:p-12">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#7A1E2A]/30 to-transparent" />
              <div className="relative grid lg:grid-cols-[0.7fr_1.3fr] gap-8 items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-md bg-[#F0B736] text-[#171923]">
                  <ShieldCheck size={46} strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F0B736] mb-3">
                    {isArabic ? "الاعتماد" : "Accreditation"}
                  </p>
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                    {isArabic ? "اعتماد تعليمي موثوق" : "Trusted Educational Accreditation"}
                  </h2>
                  <p className="text-base md:text-lg text-white/[0.74] leading-relaxed max-w-3xl">
                    {isArabic
                      ? "مدرسة المعرفة الدولية معتمدة من المركز الوطني لضمان الجودة واعتماد المؤسسات التعليمية والتدريبية. يمكن إضافة شعار جهة الاعتماد إلى هذا القسم لاحقًا بسهولة."
                      : "International Knowledge School is accredited by the National Center for Quality Assurance and Accreditation of Educational and Training Institutions. The accreditation logo can be added to this section later."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#F8F9FA] section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="local-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {isArabic ? "المراحل التعليمية" : "Educational Stages"}
              </h2>
              <p className="local-animate text-base text-[#6B7280]">
                {isArabic
                  ? "مراحل واضحة تدعم النمو اللغوي والأكاديمي والاجتماعي للطلاب."
                  : "Clear stages supporting linguistic, academic, and social growth."}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {stages.map((stage) => (
                <article
                  key={stage.title}
                  className="local-animate rounded-lg border border-[#7A1E2A]/10 bg-white p-6 shadow-sm"
                >
                  <stage.icon size={32} className="text-[#7A1E2A] mb-4" strokeWidth={1.6} />
                  <p className="text-sm font-semibold text-[#9A2D3A] mb-2">{stage.ages}</p>
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{stage.title}</h3>
                  <ul className="space-y-2">
                    {stage.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-[#5F6368]">
                        <CheckCircle2 size={16} className="text-[#7A1E2A] mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white section-padding">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <Medal size={38} className="local-animate mx-auto text-[#7A1E2A] mb-4" strokeWidth={1.6} />
              <h2 className="local-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
                {isArabic ? "المواد الدراسية" : "Our Subjects"}
              </h2>
              <p className="local-animate text-base text-[#6B7280]">
                {isArabic
                  ? "مواد أساسية منظمة ضمن شبكة نظيفة وسهلة القراءة."
                  : "Core subjects presented in a clean, easy-to-scan grid."}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {subjects.map((subject) => (
                <div
                  key={subject.name}
                  className="local-animate rounded-md bg-[#F8F9FA] border border-[#7A1E2A]/10 p-4 text-center transition-colors hover:border-[#7A1E2A]/30 hover:bg-[#7A1E2A]/5"
                >
                  <subject.icon size={24} className="mx-auto mb-3 text-[#7A1E2A]" strokeWidth={1.7} />
                  <span className="text-sm font-medium text-[#1A1A1A]">{subject.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
