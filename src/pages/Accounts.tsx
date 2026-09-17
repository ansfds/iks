import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AccountCard } from "@/components/fintech/AccountCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc";

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [countrySlug, setCountrySlug] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [bank, setBank] = useState("");

  const overviewQuery = trpc.finance.overview.useQuery(undefined, {
    staleTime: 60_000,
  });
  const accountsQuery = trpc.finance.accounts.list.useQuery(
    {
      search: search || undefined,
      countrySlug: countrySlug || undefined,
      currencySymbol: currencySymbol || undefined,
      bank: bank || undefined,
    },
    { staleTime: 20_000 },
  );

  const countries = overviewQuery.data?.countries ?? [];
  const currencies = overviewQuery.data?.currencies ?? [];
  const accounts = accountsQuery.data ?? [];

  return (
    <div className="bg-slate-50 pb-28 pt-24" dir="rtl">
      <section className="container-main px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 max-w-3xl"
        >
          <p className="mb-3 text-sm font-bold text-blue-700">حسابات التحويل</p>
          <h1 className="text-3xl font-black text-slate-950 sm:text-5xl">
            كل حسابات الشركة بروابط مباشرة وQR مستقل
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
            ابحث حسب الدولة أو البنك أو العملة، ثم انسخ بيانات الحساب مباشرة
            من الهاتف.
          </p>
        </motion.div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700">
            <SlidersHorizontal size={18} className="text-blue-700" />
            البحث والتصفية
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="relative md:col-span-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث عام"
                className="h-12 w-full rounded-md border border-slate-200 bg-slate-50 pr-10 pl-3 text-sm font-semibold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <select
              value={countrySlug}
              onChange={(event) => setCountrySlug(event.target.value)}
              className="h-12 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">كل الدول</option>
              {countries.map((country) => (
                <option key={country.id} value={country.slug}>
                  {country.nameAr}
                </option>
              ))}
            </select>
            <input
              value={bank}
              onChange={(event) => setBank(event.target.value)}
              placeholder="البنك"
              className="h-12 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={currencySymbol}
              onChange={(event) => setCurrencySymbol(event.target.value)}
              className="h-12 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">كل العملات</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.symbol}>
                  {currency.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {accountsQuery.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-96 rounded-lg" />
            ))}
          </div>
        ) : accountsQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            تعذر تحميل الحسابات الآن.
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-bold text-slate-900">لا توجد حسابات مطابقة</p>
            <p className="mt-2 text-sm text-slate-500">
              الحسابات غير المفعلة لا تظهر في الموقع العام.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
