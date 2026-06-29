import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { GraduationCap, Users, Cpu, HandHeart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function Goals() {
  const { t, dir } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".goal-animate"),
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

  const goals = [
    {
      icon: GraduationCap,
      title: t("goals.academic.title"),
      desc: t("goals.academic.desc"),
      color: "#213B6F",
      borderColor: "border-[#213B6F]",
    },
    {
      icon: Users,
      title: t("goals.character.title"),
      desc: t("goals.character.desc"),
      color: "#7B2F63",
      borderColor: "border-[#7B2F63]",
    },
    {
      icon: Cpu,
      title: t("goals.innovation.title"),
      desc: t("goals.innovation.desc"),
      color: "#2C4F8E",
      borderColor: "border-[#2C4F8E]",
    },
    {
      icon: HandHeart,
      title: t("goals.community.title"),
      desc: t("goals.community.desc"),
      color: "#0B1E35",
      borderColor: "border-[#0B1E35]",
    },
  ];

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.goals")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.goals")}</span>
          </div>
        </div>
      </section>

      <div ref={sectionRef} className="bg-[#F8F9FA] section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="goal-animate text-3xl md:text-[42px] font-bold text-[#1A1A1A] mb-4">
              {t("goals.title")}
            </h2>
            <p className="goal-animate text-base md:text-lg text-[#7C7C7C] max-w-3xl mx-auto">
              {t("goals.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {goals.map((goal, i) => (
              <div
                key={i}
                className={`goal-animate bg-white rounded-lg border-t-4 ${goal.borderColor} p-8 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${goal.color}15` }}
                >
                  <goal.icon
                    size={28}
                    style={{ color: goal.color }}
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">
                  {goal.title}
                </h3>
                <p className="text-sm text-[#7C7C7C] leading-relaxed">
                  {goal.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
