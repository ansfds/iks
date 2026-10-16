import { SiteImage } from "@/components/SiteImage";

// الخلفيات فقط تستخدم cover؛ الصور العادية تحتفظ بنسبة أبعادها كاملة.
export function SiteBackground({ src, fallbackSources = [], priority = false }: {
  src: string;
  fallbackSources?: readonly (string | null | undefined)[];
  priority?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <SiteImage src={src} fallbackSources={fallbackSources} alt="" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className="h-full w-full object-cover" />
    </div>
  );
}
