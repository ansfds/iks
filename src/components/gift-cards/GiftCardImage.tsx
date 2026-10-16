import { useState } from "react";
import { ImageOff } from "lucide-react";
import { isSupportedImageUrl, reportImageLoadError } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

type GiftCardImageProps = {
  src?: string | null;
  alt: string;
  title?: string;
  className?: string;
  fallbackText?: string;
  fallbackSrc?: string | null;
  centralFallbackSrc?: string;
  loading?: "eager" | "lazy";
};

export function GiftCardImage(props: GiftCardImageProps) {
  const sourceKey = JSON.stringify([props.src, props.centralFallbackSrc, props.fallbackSrc]);
  return <GiftCardImageLoader key={sourceKey} {...props} />;
}

function GiftCardImageLoader({
  src,
  alt,
  title,
  className,
  fallbackText,
  fallbackSrc,
  centralFallbackSrc,
  loading = "lazy",
}: GiftCardImageProps) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const activeSrc = [src, centralFallbackSrc, fallbackSrc].find(
    (url) => isSupportedImageUrl(url) && !failedUrls.includes(url),
  );

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
      referrerPolicy="no-referrer"
      onLoad={() => setLoadedUrl(activeSrc)}
      onError={() => {
        reportImageLoadError(activeSrc, alt);
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
