export function isHttpImageUrl(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isSupportedImageUrl(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (!isHttpImageUrl(value)) return false;
  // Skip mixed-content URLs on HTTPS and proceed to the configured fallback.
  return !(typeof location !== "undefined" && location.protocol === "https:" && value.startsWith("http:"));
}

export function resolveImageUrl(
  preferred: string | null | undefined,
  centralFallback: string,
  localFallback: string,
): string {
  if (isSupportedImageUrl(preferred)) return preferred;
  if (isSupportedImageUrl(centralFallback)) return centralFallback;
  return localFallback;
}

export function reportImageLoadError(src: string | null | undefined, name?: string) {
  if (import.meta.env.DEV && src) {
    console.warn(`Failed to load image (${name || "background"}): ${src}`);
  }
}
