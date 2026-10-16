import { useState } from "react";
import type { MouseEventHandler } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportedImageUrl, reportImageLoadError } from "@/lib/image-utils";

type SiteImageProps = {
  src: string;
  fallbackSrc?: string;
  fallbackSources?: readonly (string | null | undefined)[];
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  onClick?: MouseEventHandler<HTMLImageElement>;
};

export function SiteImage(props: SiteImageProps) {
  // A new source list must retry URLs that failed before the configuration changed.
  const sourceKey = JSON.stringify([props.src, props.fallbackSources, props.fallbackSrc]);
  return <SiteImageLoader key={sourceKey} {...props} />;
}

function SiteImageLoader({
  src,
  fallbackSrc,
  fallbackSources = [],
  alt,
  className,
  loading = "lazy",
  fetchPriority = "auto",
  onClick,
}: SiteImageProps) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const activeSrc = [src, ...fallbackSources, fallbackSrc].find(
    (url) => isSupportedImageUrl(url) && !failedUrls.includes(url),
  );

  if (!activeSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex h-auto w-full items-center justify-center text-slate-400",
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
      fetchPriority={fetchPriority}
      decoding="async"
      referrerPolicy="no-referrer"
      onClick={onClick}
      onLoad={() => setLoadedUrl(activeSrc)}
      onError={() => {
        reportImageLoadError(activeSrc, alt);
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
