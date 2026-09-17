export function formatMoney(
  value: number | string | null | undefined,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number },
) {
  if (value === null || value === undefined || value === "") {
    return "السعر غير متوفر حاليًا";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "السعر غير متوفر حاليًا";

  return new Intl.NumberFormat("ar-LY", {
    maximumFractionDigits: options?.maximumFractionDigits ?? 3,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
  }).format(number);
}

export function formatDateClock(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ar-LY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeTime(value: Date | string | null | undefined) {
  if (!value) return "غير متوفر";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متوفر";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes === 1) return "منذ دقيقة";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours === 1) return "منذ ساعة";
  if (hours < 24) return `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "منذ يوم";
  return `منذ ${days} يوم`;
}

export function getLatestDate<T extends { rateUpdatedAt?: Date | string | null; updatedAt?: Date | string | null }>(
  items: T[] | undefined,
) {
  const timestamps =
    items
      ?.map((item) => item.rateUpdatedAt ?? item.updatedAt)
      .filter(Boolean)
      .map((value) => new Date(value as string | Date).getTime())
      .filter((value) => Number.isFinite(value)) ?? [];

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

export function buildAccountPath(countrySlug: string, accountSlug: string) {
  return `/accounts/${countrySlug}/${accountSlug}`;
}

export function buildAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
