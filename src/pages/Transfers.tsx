import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CheckCircle, Copy, Landmark, ShieldCheck, UserRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { useSiteContent } from "@/hooks/useSiteContent";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GSAP: any = gsap;

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

export default function Transfers() {
  const { t, dir } = useLanguage();
  const cms = useSiteContent();
  const accountsQuery = trpc.finance.accounts.list.useQuery(undefined, { staleTime: 0, refetchInterval: 30_000 });
  const transferAccounts = (accountsQuery.data ?? []).map(item => ({
    iban: item.iban || item.accountNumber, bank: item.bankNameAr, name: item.accountName,
  }));
  const sectionRef = useRef<HTMLDivElement>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (sectionRef.current) {
        GSAP.fromTo(
          sectionRef.current.querySelectorAll(".transfers-animate"),
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
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
  }, []);

  const handleCopy = async (iban: string) => {
    await copyText(iban);
    setCopiedIban(iban);
    window.setTimeout(() => {
      setCopiedIban((current) => (current === iban ? null : current));
    }, 1800);
  };

  return (
    <div dir={dir}>
      <section className="relative flex min-h-[40vh] max-h-[400px] items-center justify-center bg-gradient-hero">
        <div className="relative z-10 px-4 text-center">
          <h1 className="mb-3 text-4xl font-bold text-white md:text-[56px]">
            {t("page.transfers")}
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Link to="/" className="transition-colors hover:text-white">
              {t("nav.home")}
            </Link>
            <span>/</span>
            <span className="text-white/80">{t("page.transfers")}</span>
          </div>
        </div>
      </section>

      <section ref={sectionRef} className="bg-[#F8F9FA] section-padding" style={{ display: cms.isVisible("section_banks") ? undefined : "none" }}>
        <div className="container-main">
          <div className="transfers-animate mx-auto mb-10 max-w-3xl text-center">
            <span className="mb-3 inline-flex rounded-full bg-[#213B6F]/10 px-4 py-2 text-sm font-semibold text-[#213B6F]">
              التحويلات
            </span>
            <h2 className="mb-4 text-3xl font-bold leading-tight text-[#1A1A1A] md:text-[42px]">
              حسابات التحويل
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-8 text-[#7C7C7C] md:text-lg">
              اختر الحساب المناسب واضغط على رقم الحساب لنسخه مباشرة.
            </p>
          </div>

          <div className="transfers-animate rounded-lg bg-gradient-to-br from-[#0B1E35] via-[#0F3B82] to-[#1D7FEA] p-4 shadow-[0_20px_60px_rgba(15,59,130,0.22)] sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b border-white/15 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#D7ECFF]">
                  الحسابات الرسمية
                </p>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  اختر الحساب المطلوب
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                <ShieldCheck size={18} className="text-[#38BDF8]" />
                نسخ آمن ومباشر
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {accountsQuery.isLoading && <p className="col-span-full text-center text-white">جاري تحميل الحسابات...</p>}
              {accountsQuery.isError && <p className="col-span-full text-center text-white">تعذر تحميل الحسابات، يرجى إعادة المحاولة.</p>}
              {!accountsQuery.isLoading && !accountsQuery.isError && transferAccounts.length === 0 && <p className="col-span-full text-center text-white">لا توجد حسابات مصرفية متاحة حاليًا.</p>}
              {transferAccounts.map((account, index) => {
                const isCopied = copiedIban === account.iban;

                return (
                  <article
                    key={account.iban}
                    className="transfers-animate rounded-lg border border-white/15 bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#1D7FEA]">
                          الحساب {index + 1}
                        </p>
                        <h4 className="mt-2 flex items-center gap-2 text-xl font-bold text-[#1A1A1A]">
                          <Landmark size={20} className="text-[#213B6F]" />
                          {account.bank}
                        </h4>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#213B6F]/10 text-[#213B6F]">
                        <UserRound size={20} />
                      </div>
                    </div>

                    <div className="mb-4 rounded-md bg-[#F8F9FA] p-4">
                      <p className="mb-1 text-xs font-semibold text-[#7C7C7C]">
                        اسم صاحب الحساب
                      </p>
                      <p className="text-base font-bold leading-7 text-[#1A1A1A]">
                        {account.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(account.iban)}
                      aria-label={`نسخ رقم الحساب ${account.iban}`}
                      className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-[#D8E0F0] bg-white px-3 py-3 text-[#213B6F] transition-colors hover:border-[#213B6F] hover:bg-[#213B6F]/5 focus:outline-none focus:ring-4 focus:ring-[#213B6F]/15"
                    >
                      <span
                        dir="ltr"
                        className="min-w-0 flex-1 break-all text-left font-mono text-base font-black tracking-normal sm:text-lg"
                        style={{ unicodeBidi: "isolate" }}
                      >
                        {account.iban}
                      </span>
                      <Copy size={19} className="shrink-0 transition-transform group-hover:scale-110" />
                    </button>

                    <div className="mt-3 min-h-6">
                      {isCopied && (
                        <p className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                          <CheckCircle size={15} />
                          تم نسخ رقم الحساب ✓
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
