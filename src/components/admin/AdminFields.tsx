import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

export const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";
export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={4}
          className={inputClass}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className={inputClass}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold">
      <input
        type="checkbox"
        className="h-4 w-4 accent-blue-700"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
export function SaveButton({
  onClick,
  busy = false,
  disabled = false,
  label = "حفظ التعديلات",
}: {
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={onClick}
      className={`${buttonClass} bg-[#213B6F] text-white hover:bg-[#2C4F8E]`}
    >
      {busy ? (
        <Loader2 size={17} className="animate-spin" />
      ) : (
        <Save size={17} />
      )}{" "}
      {label}
    </button>
  );
}
export function ImageField({
  label,
  value,
  onChange,
  onValidity,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidity?: (valid: boolean) => void;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty">(
    "empty"
  );
  const upload = trpc.cms.uploadImage.useMutation();
  useEffect(() => {
    let active = true;
    const clean = value.trim();
    if (!clean) {
      onValidity?.(true);
      return;
    }
    const supported = /^https:\/\//.test(clean) || /^\/images\//.test(clean);
    if (!supported) {
      onValidity?.(false);
      return;
    }
    onValidity?.(false);
    const img = new Image();
    img.onload = () => {
      if (active) {
        setStatus("ready");
        onValidity?.(true);
      }
    };
    img.onerror = () => {
      if (active) {
        setStatus("error");
        onValidity?.(false);
      }
    };
    img.src = clean;
    const timer = window.setTimeout(() => {
      if (active && !img.complete) {
        setStatus("error");
        onValidity?.(false);
      }
    }, 15000);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [value, onValidity]);
  const change = (next: string) => {
    setStatus(next ? "loading" : "empty");
    onChange(next);
  };
  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (
      file.size > 2097152 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      toast.error("اختر PNG أو JPEG أو WebP بحجم أقصاه 2 MB.");
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await upload.mutateAsync({
        mime: file.type as "image/png" | "image/jpeg" | "image/webp",
        base64,
      });
      change(result.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر رفع الصورة");
    }
  };
  const unsupported =
    value && !(/^https:\/\//.test(value) || /^\/images\//.test(value));
  return (
    <div className="space-y-3">
      <TextField label={label} value={value} onChange={change} type="url" />
      <label className="block text-sm font-medium">
        {upload.isPending ? "جارٍ رفع الصورة…" : "أو رفع صورة"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={upload.isPending}
          className="mt-2 block w-full text-xs"
          onChange={e => {
            void uploadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {value && !unsupported && (
        <img
          key={value}
          src={value}
          alt="معاينة الصورة قبل الحفظ"
          referrerPolicy="no-referrer"
          className="max-h-52 w-full rounded-xl bg-slate-100 object-contain"
          onError={() => setStatus("error")}
        />
      )}
      {(status === "error" || unsupported) && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          تعذر تحميل الصورة. تحقق من الرابط قبل الحفظ.
        </p>
      )}
      {value && status === "loading" && (
        <p className="text-xs text-slate-500">جارٍ التحقق من الصورة…</p>
      )}
    </div>
  );
}
