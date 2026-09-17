import { Link, useParams } from "react-router";
import { ArrowRight } from "lucide-react";
import { AccountCard } from "@/components/fintech/AccountCard";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/providers/trpc";

export default function AccountDetail() {
  const params = useParams();
  const countrySlug = params.countrySlug ?? "";
  const accountSlug = params.accountSlug ?? "";

  const accountQuery = trpc.finance.accounts.bySlug.useQuery(
    { countrySlug, accountSlug },
    {
      enabled: Boolean(countrySlug && accountSlug),
      retry: false,
    },
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28 pt-24" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <Link
          to="/accounts"
          className="mb-6 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:text-blue-700"
        >
          <ArrowRight size={18} />
          كل الحسابات
        </Link>

        {accountQuery.isLoading ? (
          <Skeleton className="h-[520px] max-w-2xl rounded-lg" />
        ) : accountQuery.error || !accountQuery.data ? (
          <div className="max-w-2xl rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h1 className="text-2xl font-black text-slate-950">
              الحساب غير متوفر
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              قد يكون الرابط غير صحيح أو تم تعطيل الحساب من لوحة الإدارة.
            </p>
            <Link
              to="/accounts"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-5 text-sm font-bold text-white"
            >
              العودة للحسابات
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl">
            <AccountCard account={accountQuery.data} />
          </div>
        )}
      </div>
    </div>
  );
}
