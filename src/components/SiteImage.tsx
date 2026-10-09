import { useState } from "react";
import type { MouseEventHandler } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportImageLoadError } from "@/lib/image-utils";

export function SiteImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
  onClick,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  onClick?: MouseEventHandler<HTMLImageElement>;
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const primaryFailed = failedUrls.includes(src);
  const fallbackFailed = fallbackSrc ? failedUrls.includes(fallbackSrc) : true;
  const activeSrc =
    !primaryFailed ? src : fallbackSrc && !fallbackFailed ? fallbackSrc : null;

  if (!activeSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-full min-h-40 w-full items-center justify-center bg-slate-100 text-slate-500",
          className,
        )}
      >
        <ImageOff className="h-8 w-8" />
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
      onClick={onClick}
      onLoad={() => setLoadedUrl(activeSrc)}
      onError={() => {
        reportImageLoadError(activeSrc);
        setFailedUrls((current) =>
          current.includes(activeSrc) ? current : [...current, activeSrc],
        );
      }}
      className={cn(
        "h-auto w-full object-contain opacity-0 transition-opacity duration-200",
        loadedUrl === activeSrc && "opacity-100",
        className,
      )}
    />
  );
}
