import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Printer, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import { buildAbsoluteUrl, buildAccountPath } from "@/lib/finance";

export type PublicAccount = {
  id: number;
  bankNameAr: string;
  bankNameEn: string | null;
  accountName: string;
  accountNumber: string;
  iban: string | null;
  bankLogoUrl: string | null;
  notesAr: string | null;
  notesEn: string | null;
  slug: string;
  countryNameAr: string;
  countrySlug: string;
  countryFlagEmoji: string | null;
  currencySymbol: string;
};

function copyText(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`تم نسخ ${label}`);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function QrModal({
  account,
  onClose,
}: {
  account: PublicAccount;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const path = buildAccountPath(account.countrySlug, account.slug);
  const url = buildAbsoluteUrl(path);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(url, {
      width: 440,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (mounted) setQrDataUrl(dataUrl);
    });

    return () => {
      mounted = false;
    };
  }, [url]);

  const printQr = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open("", "_blank", "width=520,height=640");
    if (!printWindow) return;
    const safeBankName = escapeHtml(account.bankNameAr);
    const safeAccountName = escapeHtml(account.accountName);
    const safeUrl = escapeHtml(url);
    printWindow.document.write(`
      <html dir="rtl">
        <head><title>${safeBankName}</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 32px;">
          <h1 style="font-size: 22px;">${safeBankName}</h1>
          <p>${safeAccountName}</p>
          <img src="${qrDataUrl}" style="width: 360px; height: 360px;" />
          <p style="word-break: break-all;">${safeUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`QR ${account.bankNameAr}`}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-950">
              QR الحساب المباشر
            </h3>
            <p className="mt-1 text-sm text-slate-500">{account.bankNameAr}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR لرابط حساب ${account.bankNameAr}`}
              className="h-72 w-72"
            />
          ) : (
            <div className="flex h-72 w-72 items-center justify-center text-sm font-semibold text-slate-500">
              جاري توليد QR...
            </div>
          )}
        </div>

        <p className="mt-4 break-all rounded-md bg-slate-50 p-3 text-xs text-slate-500">
          {url}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => copyText(url, "الرابط")}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            <Copy size={16} />
            نسخ
          </button>
          <a
            href={qrDataUrl}
            download={`${account.countrySlug}-${account.slug}.png`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            <Download size={16} />
            تنزيل
          </a>
          <button
            type="button"
            onClick={printQr}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            <Printer size={16} />
            طباعة
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccountCard({ account }: { account: PublicAccount }) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const path = buildAccountPath(account.countrySlug, account.slug);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" dir="rtl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-blue-50 text-lg font-black text-blue-700">
            {account.bankLogoUrl ? (
              <img
                src={account.bankLogoUrl}
                alt={`شعار ${account.bankNameAr}`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              account.bankNameAr.slice(0, 1)
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {account.bankNameAr}
            </h2>
            <p className="text-sm font-semibold text-slate-500">
              {account.countryFlagEmoji ? `${account.countryFlagEmoji} ` : ""}
              {account.countryNameAr} - {account.currencySymbol}
            </p>
          </div>
        </div>
        <a
          href={path}
          className="rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
        >
          الرابط
        </a>
      </div>

      <dl className="space-y-3">
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="text-xs font-bold text-slate-500">اسم صاحب الحساب</dt>
          <dd className="mt-1 font-black text-slate-950">{account.accountName}</dd>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <dt className="text-xs font-bold text-slate-500">رقم الحساب</dt>
          <dd className="mt-1 break-all font-black text-slate-950">
            {account.accountNumber}
          </dd>
        </div>
        {account.iban && (
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs font-bold text-slate-500">IBAN</dt>
            <dd className="mt-1 break-all font-black text-slate-950">
              {account.iban}
            </dd>
          </div>
        )}
      </dl>

      {account.notesAr && (
        <p className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-7 text-blue-950">
          {account.notesAr}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => copyText(account.accountNumber, "رقم الحساب")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <Copy size={18} />
          نسخ الحساب
        </button>
        <button
          type="button"
          disabled={!account.iban}
          onClick={() => account.iban && copyText(account.iban, "IBAN")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Copy size={18} />
          نسخ IBAN
        </button>
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
        >
          <QrCode size={18} />
          عرض QR
        </button>
      </div>

      {isQrOpen && <QrModal account={account} onClose={() => setIsQrOpen(false)} />}
    </article>
  );
}
