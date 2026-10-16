import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardCopy, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { formatMoney, formatRelativeTime } from "@/lib/finance";
import { Skeleton } from "@/components/ui/skeleton";

function ResultRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-left font-bold ${accent ? "text-xl text-blue-700" : "text-slate-900"}`}
      >
        {value}
      </motion.span>
    </div>
  );
}

export function FinanceCalculator() {
  const [selectedService, setSelectedService] = useState("");
  const [amount, setAmount] = useState("");
  const amountNumber = useMemo(() => Number(amount), [amount]);
  const deferredAmount = useDeferredValue(amountNumber);

  const optionsQuery = trpc.finance.calculatorOptions.useQuery(undefined, {
    staleTime: 60_000,
  });

  const options = optionsQuery.data ?? [];
  const activeServiceId = Number(selectedService || options[0]?.serviceId || 0);
  const canCalculate = activeServiceId > 0 && deferredAmount > 0;

  const calculationQuery = trpc.finance.calculate.useQuery(
    { serviceId: activeServiceId, amount: deferredAmount },
    {
      enabled: canCalculate,
      staleTime: 0,
      retry: false,
    },
  );

  const selectedOption = options.find(
    (option) => option.serviceId === activeServiceId,
  );
  const result = calculationQuery.data;
  const isBusy =
    optionsQuery.isLoading || (canCalculate && calculationQuery.isFetching);

  const copyResult = async () => {
    if (!result || result.status !== "ok") return;

    const message = [
      "طلب حساب حوالة - الوسيط المعتمد",
      `الخدمة: ${result.service.nameAr}`,
      `المبلغ: ${formatMoney(result.amount)} ${result.currency.symbol}`,
      `سعر الصرف: ${formatMoney(result.exchangeRate)}`,
      `قيمة التحويل: ${formatMoney(result.baseAmount)}`,
      `العمولة: ${formatMoney(result.commissionAmount)}`,
      `الإجمالي النهائي: ${formatMoney(result.totalAmount)}`,
      result.disclaimer,
    ].join("\n");

    await navigator.clipboard.writeText(message);
    toast.success("تم نسخ النتيجة بصيغة جاهزة للإرسال");
  };

  return (
    <section id="calculator" className="bg-white py-14 sm:py-20" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-bold text-blue-700">حاسبة التحويل</p>
          <h2 className="text-3xl font-black text-slate-950 sm:text-4xl">
            احسب حوالتك مباشرة من الأسعار والعمولات المعتمدة
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
            {optionsQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : options.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="font-bold text-slate-900">لا توجد خدمات مفعلة للحاسبة</p>
                <p className="mt-2 text-sm text-slate-500">
                  أضف خدمة مفعلة للحاسبة واربطها بعملة من لوحة الإدارة.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    اختر الخدمة
                  </span>
                  <select
                    value={selectedService || String(options[0]?.serviceId ?? "")}
                    onChange={(event) => setSelectedService(event.target.value)}
                    className="h-13 w-full rounded-md border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  >
                    {options.map((option) => (
                      <option key={option.serviceId} value={option.serviceId}>
                        {option.serviceNameAr} - {option.currencySymbol}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    المبلغ
                  </span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                    min="0"
                    type="number"
                    placeholder="اكتب المبلغ"
                    className="h-14 w-full rounded-md border border-slate-300 bg-white px-4 text-xl font-black text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
                  كل الأسعار والعمولات تُقرأ من قاعدة البيانات. إذا لم توجد شريحة
                  مناسبة أو كان السعر غير مدخل، ستظهر رسالة واضحة بدون أرقام
                  افتراضية.
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-cyan-300 via-blue-600 to-slate-950" />

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-500">النتيجة</p>
                <h3 className="text-xl font-black text-slate-950">
                  تفاصيل الحسبة النهائية
                </h3>
              </div>
              {isBusy ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <RefreshCcw className="h-5 w-5 text-slate-400" />
              )}
            </div>

            <AnimatePresence mode="wait">
              {!canCalculate ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center"
                >
                  <p className="font-bold text-slate-900">
                    اختر خدمة واكتب مبلغًا لبدء الحساب
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    النتيجة ستتحدث أثناء الكتابة.
                  </p>
                </motion.div>
              ) : calculationQuery.isLoading || calculationQuery.isFetching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-16 w-full" />
                </motion.div>
              ) : calculationQuery.error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700"
                >
                  تعذر حساب الحوالة الآن. يرجى المحاولة لاحقًا.
                </motion.div>
              ) : result?.status === "unavailable" ? (
                <motion.div
                  key="unavailable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800"
                >
                  {result.reason}
                </motion.div>
              ) : result?.status === "ok" ? (
                <motion.div
                  key={`${result.service.id}-${result.amount}-${result.totalAmount}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                >
                  <div className="rounded-lg bg-slate-50 px-4">
                    <ResultRow
                      label="الخدمة"
                      value={`${result.service.nameAr} - ${result.currency.symbol}`}
                    />
                    <ResultRow label="المبلغ" value={formatMoney(result.amount)} />
                    <ResultRow
                      label="سعر الصرف"
                      value={formatMoney(result.exchangeRate, {
                        maximumFractionDigits: 6,
                      })}
                    />
                    <ResultRow
                      label="قيمة التحويل"
                      value={formatMoney(result.baseAmount)}
                    />
                    <ResultRow
                      label="نوع العمولة"
                      value={
                        result.commissionRule.commissionType === "percentage"
                          ? "نسبة مئوية"
                          : "قيمة ثابتة"
                      }
                    />
                    <ResultRow
                      label="قيمة العمولة"
                      value={formatMoney(result.commissionAmount)}
                    />
                    <ResultRow
                      label="الإجمالي النهائي"
                      value={formatMoney(result.totalAmount)}
                      accent
                    />
                  </div>
                  <p className="mt-4 rounded-md bg-blue-50 p-3 text-sm leading-7 text-blue-950">
                    {result.disclaimer}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={copyResult}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                    >
                      <ClipboardCopy size={18} />
                      نسخ النتيجة
                    </button>
                    <span className="flex items-center justify-center rounded-md bg-slate-100 px-4 text-xs font-semibold text-slate-500">
                      آخر تحديث {formatRelativeTime(result.rateUpdatedAt)}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500"
                >
                  بانتظار البيانات.
                </motion.div>
              )}
            </AnimatePresence>

            {selectedOption && !result && (
              <p className="mt-4 text-xs text-slate-400">
                الخدمة المحددة: {selectedOption.serviceNameAr}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
