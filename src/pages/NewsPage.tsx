import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

export default function NewsPage() {
  const { language, t, dir } = useLanguage();
  const isArabic = language === "ar";
  const [activeTab, setActiveTab] = useState<"all" | "news" | "events">("all");
  const sectionRef = useRef<HTMLDivElement>(null);

  const { data: newsData } = trpc.news.list.useQuery({
    type: activeTab,
    page: 1,
    limit: 10,
  });

  const items = newsData?.items ?? [];

  const fallbackNews = [
    {
      id: 1,
      title: "Knowledge Hosts International Education Conference",
      titleAr: "المعرفة تستضيف مؤتمر التعليم الدولي",
      excerpt: "Join us for a day of learning and networking with educators from around the world.",
      excerptAr: "انضم إلينا يوماً من التعلم والتواصل مع المربين من جميع أنحاء العالم.",
      imageUrl: "/images/about-classroom.jpg",
      eventDate: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      title: "Open Day: Discover Our Campus",
      titleAr: "يوم مفتوح: اكتشف حرمنا",
      excerpt: "Experience Knowledge firsthand. Tour our facilities and meet our teachers.",
      excerptAr: "جرب المعرفة عن كثب. جول في مرافقنا وقابل معلمينا.",
      imageUrl: "/images/campus-exterior.jpg",
      eventDate: "2025-03-15",
      createdAt: new Date(),
    },
    {
      id: 3,
      title: "Student Wins Regional Science Competition",
      titleAr: "طالب يفوز بمسابقة العلوم الإقليمية",
      excerpt: "Congratulations to Omar Khalid for winning first place in the Regional Science Fair.",
      excerptAr: "تهانينا لعمر خالد لحصوله على المركز الأول في معرض العلوم الإقليمي.",
      imageUrl: "/images/science-lab.jpg",
      eventDate: null,
      createdAt: new Date(),
    },
  ];

  const displayItems = items.length > 0 ? items : fallbackNews;

  const events = displayItems.filter((item) => item.eventDate);
  const news = displayItems.filter((item) => !item.eventDate);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".news-animate"),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
            },
          }
        );
      }
    });
    return () => ctx.revert();
  }, [activeTab]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div dir={dir}>
      <section className="relative min-h-[40vh] max-h-[400px] flex items-center justify-center bg-gradient-hero">
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-[56px] font-bold text-white mb-3">
            {t("page.news")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.news")}</span>
          </div>
        </div>
      </section>

      <section className="bg-white section-padding">
        <div className="container-main">
          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {(["all", "news", "events"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${
                  activeTab === tab
                    ? "bg-[#213B6F] text-white"
                    : "bg-[#F8F9FA] text-[#7C7C7C] hover:bg-[#D8E0F0]"
                }`}
              >
                {tab === "all"
                  ? t("gallery.all")
                  : tab === "news"
                  ? isArabic
                    ? "أخبار"
                    : "News"
                  : t("news.upcoming")}
              </button>
            ))}
          </div>

          <div ref={sectionRef}>
            {/* News Items */}
            {(activeTab === "all" || activeTab === "news") && news.length > 0 && (
              <div className="space-y-6 mb-12">
                <h2 className="news-animate text-2xl font-bold text-[#1A1A1A] mb-6">
                  {isArabic ? "آخر الأخبار" : "Latest News"}
                </h2>
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="news-animate card-shadow bg-white border border-[rgba(11,30,53,0.08)] rounded-lg overflow-hidden"
                  >
                    <div className="grid md:grid-cols-3 gap-0">
                      <div className="md:col-span-1">
                        <img
                          src={item.imageUrl ?? "/images/about-classroom.jpg"}
                          alt={isArabic && item.titleAr ? item.titleAr : item.title}
                          className="w-full h-full object-cover min-h-[200px]"
                        />
                      </div>
                      <div className="md:col-span-2 p-6 lg:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-sm text-[#7C7C7C] mb-3">
                          <Newspaper size={14} />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-3">
                          {isArabic && item.titleAr ? item.titleAr : item.title}
                        </h3>
                        <p className="text-sm text-[#7C7C7C] leading-relaxed mb-4">
                          {isArabic && item.excerptAr
                            ? item.excerptAr
                            : item.excerpt ?? ""}
                        </p>
                        <span className="inline-flex items-center gap-1 text-sm text-[#213B6F] font-medium">
                          {t("news.readMore")}
                          <ArrowRight
                            size={14}
                            className={dir === "rtl" ? "rotate-180" : ""}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Events */}
            {(activeTab === "all" || activeTab === "events") && (
              <div>
                <h2 className="news-animate text-2xl font-bold text-[#1A1A1A] mb-6">
                  {t("news.upcoming")}
                </h2>
                {events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="news-animate card-shadow bg-[#F8F9FA] border border-[rgba(11,30,53,0.08)] rounded-lg p-6 flex flex-col md:flex-row md:items-center gap-4"
                      >
                        <div className="flex items-center justify-center w-16 h-16 bg-[#213B6F] text-white rounded-lg shrink-0">
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {event.eventDate
                                ? new Date(event.eventDate).getDate()
                                : ""}
                            </div>
                            <div className="text-[10px] uppercase">
                              {event.eventDate
                                ? new Date(event.eventDate).toLocaleDateString(
                                    language === "ar" ? "ar-SA" : "en-US",
                                    { month: "short" }
                                  )
                                : ""}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1">
                            {isArabic && event.titleAr
                              ? event.titleAr
                              : event.title}
                          </h3>
                          <p className="text-sm text-[#7C7C7C]">
                            {isArabic && event.excerptAr
                              ? event.excerptAr
                              : event.excerpt ?? ""}
                          </p>
                        </div>
                        <div className="md:ml-auto shrink-0">
                          <div className="flex items-center gap-2 text-sm text-[#213B6F]">
                            <Calendar size={16} />
                            <span>{formatDate(event.eventDate)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="news-animate text-center text-[#7C7C7C] py-10">
                    {t("news.noEvents")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
