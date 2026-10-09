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

export function resolveImageUrl(
  preferred: string | null | undefined,
  centralFallback: string,
  localFallback: string,
): string {
  if (isHttpImageUrl(preferred)) return preferred;
  if (isHttpImageUrl(centralFallback)) return centralFallback;
  return localFallback;
}

export function reportImageLoadError(src: string | null | undefined) {
  if (import.meta.env.DEV && src) {
    console.warn(`Failed to load image: ${src}`);
  }
}
