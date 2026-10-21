import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { lastCmsSave, setCmsRevision, type CmsSave } from "@/lib/cms-state";

export function CmsDeploymentBanner() {
  const initialized = useRef(false);
  const snapshot = trpc.cms.snapshot.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [saved, setSaved] = useState<CmsSave | null>(lastCmsSave);
  const status = trpc.cms.deployment.useQuery(
    { commit: saved?.commit || "0".repeat(40) },
    {
      enabled: Boolean(saved),
      retry: false,
      refetchInterval: query =>
        ["deployed", "failed"].includes(query.state.data?.state || "")
          ? false
          : 5000,
      refetchOnWindowFocus: true,
    }
  );
  useEffect(() => {
    if (snapshot.data && !initialized.current) {
      setCmsRevision(snapshot.data.revision);
      initialized.current = true;
    }
  }, [snapshot.data]);
  useEffect(() => {
    const listener = (event: Event) =>
      setSaved((event as CustomEvent<CmsSave>).detail);
    window.addEventListener("cms-saved", listener);
    return () => window.removeEventListener("cms-saved", listener);
  }, []);
  const label = status.isError
    ? "تم الحفظ؛ تعذر التحقق من النشر"
    : !saved
      ? snapshot.error ? "تعذر تحميل حالة التحرير" : snapshot.data?.writesEnabled ? "جاهز للتحرير" : "معاينة مقفلة: الحفظ غير مفعّل"
      : status.data?.state === "deployed"
        ? "تم النشر"
        : status.data?.state === "failed"
          ? "فشل النشر"
          : status.data?.state === "deploying"
            ? "جارٍ النشر"
            : "تم الحفظ؛ بانتظار بدء النشر";
  return (
    <div
      role="status"
      className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-950"
    >
      <p className="font-bold">{label}</p>
      <p>
        يظهر التعديل للعامة بعد اكتمال النشر.{" "}
        {snapshot.data?.branch && (
          <>
            فرع التحرير: <b dir="ltr">{snapshot.data.branch}</b>.
          </>
        )}
      </p>
      {snapshot.error && <p role="alert">{snapshot.error.message}</p>}
      {snapshot.data && !snapshot.data.writesEnabled && (
        <p>الحفظ غير مفعّل لهذه البيئة بعد.</p>
      )}
      {status.error && <p>{status.error.message}</p>}
      {status.data?.url && (
        <a
          className="underline"
          href={status.data.url}
          target="_blank"
          rel="noreferrer"
        >
          افتح النسخة المنشورة
        </a>
      )}
      {saved && status.data?.state === "saved" && (
        <p>
          إذا تأخر بدء النشر، راجع ربط GitHub وإعداد تجاهل البناء في Vercel.
        </p>
      )}
    </div>
  );
}
