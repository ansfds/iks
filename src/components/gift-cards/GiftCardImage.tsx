import { useState } from "react";
import { ImageOff } from "lucide-react";
import { reportImageLoadError } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

export function GiftCardImage({
  src,
  alt,
  title,
  className,
  fallbackText,
  fallbackSrc,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  title?: string;
  className?: string;
  fallbackText?: string;
  fallbackSrc?: string | null;
  loading?: "eager" | "lazy";
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const primaryFailed = Boolean(src && failedUrls.includes(src));
  const fallbackFailed = Boolean(fallbackSrc && failedUrls.includes(fallbackSrc));
  const activeSrc =
    src && !primaryFailed
      ? src
      : fallbackSrc && !fallbackFailed
        ? fallbackSrc
        : null;

  if (!activeSrc) {
    return (
      <div
        className={cn(
          "flex h-full min-h-44 w-full flex-col items-center justify-center gap-3 rounded-md bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-500 p-6 text-center text-white",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-10 w-10 text-white/70" />
        <span className="text-xl font-black tracking-normal">
          {fallbackText || title || "Gift Card"}
        </span>
      </div>
    );
  }

  return (
    <img
      key={activeSrc}
      src={activeSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoadedUrl(activeSrc)}
      onError={() => {
        reportImageLoadError(activeSrc);
        setFailedUrls((current) =>
          current.includes(activeSrc) ? current : [...current, activeSrc],
        );
      }}
      className={cn(
        "h-full w-full object-contain opacity-0 transition-opacity duration-200",
        loadedUrl === activeSrc && "opacity-100",
        className,
      )}
    />
  );
}
