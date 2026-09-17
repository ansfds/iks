import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowDownLeft, ArrowUpRight, CircleDollarSign } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatMoney, formatRelativeTime } from "@/lib/finance";
import { Skeleton } from "@/components/ui/skeleton";

export function RatesSection() {
  const ratesQuery = trpc.finance.rates.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <section id="rates" className="bg-slate-50 py-14 sm:py-20" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-bold text-blue-700">أسعار اليوم</p>
            <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
              أسعار العملات والخدمات من لوحة الإدارة
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
            <Activity size={18} className="text-blue-600" />
            تحديث تلقائي كل دقيقة
          </div>
        </div>

        {ratesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : ratesQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            تعذر تحميل الأسعار الآن.
          </div>
        ) : (ratesQuery.data ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-bold text-slate-900">لا توجد عملات بعد</p>
            <p className="mt-2 text-sm text-slate-500">
              أضف العملات والأسعار من لوحة الإدارة. لن يتم عرض أسعار افتراضية.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnimatePresence>
              {(ratesQuery.data ?? []).map((rate) => (
                <motion.article
                  key={rate.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35 }}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                        <CircleDollarSign size={22} />
                      </span>
                      <div>
                        <h3 className="text-xl font-black text-slate-950">
                          {rate.symbol}
                        </h3>
                        <p className="text-xs text-slate-500">{rate.nameAr}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        rate.isActive && rate.rateIsActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rate.isActive && rate.rateIsActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <ArrowDownLeft size={16} />
                        شراء
                      </span>
                      <motion.span
                        key={`buy-${rate.buyPrice}`}
                        initial={{ opacity: 0.35 }}
                        animate={{ opacity: 1 }}
                        className="font-black text-slate-950"
                      >
                        {formatMoney(rate.buyPrice)}
                      </motion.span>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <ArrowUpRight size={16} />
                        بيع
                      </span>
                      <motion.span
                        key={`sell-${rate.sellPrice}`}
                        initial={{ opacity: 0.35 }}
                        animate={{ opacity: 1 }}
                        className="font-black text-slate-950"
                      >
                        {formatMoney(rate.sellPrice)}
                      </motion.span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-400">
                    آخر تحديث {formatRelativeTime(rate.updatedAt)}
                  </p>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
