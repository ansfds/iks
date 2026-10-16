import { useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Ban, Clock3, Gift, Sparkles } from "lucide-react";
import { GiftCardImage } from "@/components/gift-cards/GiftCardImage";
import { getGiftCardImages } from "@/config/gift-card-images";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveImageUrl } from "@/lib/image-utils";
import { formatFaceValue, giftCardStatusLabels } from "@/lib/giftCards";
import { trpc } from "@/providers/trpc";

function GiftCardGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <Skeleton className="h-48 rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GiftCards() {
  const cardsQuery = trpc.giftCards.list.useQuery(undefined, {
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (import.meta.env.DEV && cardsQuery.error) {
      console.error("[gift-cards] Failed to load gift cards", cardsQuery.error);
    }
  }, [cardsQuery.error]);

  const cards = (cardsQuery.data ?? []).filter(
    (card) => card?.id && card.displayName && card.slug,
  );
  const statusOrder = {
    AVAILABLE: 0,
    COMING_SOON: 1,
    UNAVAILABLE: 2,
    HIDDEN: 3,
  } as const;
  const sortedCards = [...cards].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.displayName.localeCompare(b.displayName),
  );
  const availableCards = sortedCards.filter(
    (card) => card.status === "AVAILABLE",
  );
  const comingSoonCards = sortedCards.filter(
    (card) => card.status === "COMING_SOON",
  );
  const unavailableCards = sortedCards.filter(
    (card) => card.status === "UNAVAILABLE",
  );

  const renderCards = (
    sectionCards: typeof cards,
    animationStartIndex = 0,
  ) => (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sectionCards.map((card, sectionIndex) => {
        const index = animationStartIndex + sectionIndex;
        const images = getGiftCardImages(card.slug);
        const cardImage = resolveImageUrl(
          card.imageUrl,
          images.cardImage,
          images.localFallback,
        );
        const isAvailable = card.status === "AVAILABLE";
        const isComingSoon = card.status === "COMING_SOON";
        const isUnavailable = card.status === "UNAVAILABLE";
        const range = card.valueRange
          ? `${formatFaceValue(card.valueRange.min, card.currency)} - ${formatFaceValue(
              card.valueRange.max,
              card.currency,
            )}`
          : "الفئات قريبًا";

        const cardBody = (
          <article
            className={`gift-card-enter group relative h-full overflow-hidden rounded-lg bg-white shadow-sm ${
              isAvailable
                ? "transition duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:shadow-xl"
                : "cursor-not-allowed"
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {(isComingSoon || isUnavailable) && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/5">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/90 px-5 py-2 text-sm font-black text-white shadow-lg">
                  {isComingSoon ? <Clock3 size={15} /> : <Ban size={15} />}
                  {giftCardStatusLabels[card.status]}
                </span>
              </div>
            )}

            <div className={isComingSoon ? "opacity-25" : ""}>
              <div className="aspect-[16/10] overflow-hidden">
                <GiftCardImage
                  src={cardImage}
                  centralFallbackSrc={images.cardImage}
                  fallbackSrc={images.localFallback}
                  alt={`صورة ${card.displayName}`}
                  title={card.displayName}
                  className={`transition duration-500 ${
                    isAvailable ? "group-hover:scale-[1.025]" : ""
                  }`}
                />
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black tracking-normal text-slate-950">
                      {card.displayName}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {range}
                    </p>
                  </div>
                  {isAvailable && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      {giftCardStatusLabels[card.status]}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-blue-700">
                  <span>{card.regionLabel}</span>
                  {isAvailable && (
                    <span className="inline-flex items-center gap-1">
                      فتح
                      <ArrowLeft size={15} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        );

        if (!isAvailable) {
          return (
            <div key={card.id} aria-disabled="true">
              {cardBody}
            </div>
          );
        }

        return (
          <Link key={card.id} to={`/gift-cards/${card.slug}`}>
            {cardBody}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-16" dir="rtl">
      <section className="relative overflow-hidden bg-[#07111f]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(34,197,94,0.16),transparent_28%)]" />
        <div className="container-main relative px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-cyan-100">
              <Sparkles size={16} />
              Gift Card
            </div>
            <h1 className="text-4xl font-black tracking-normal text-white sm:text-5xl">
              بطاقات الهدايا الرقمية
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              اختر المنصة، ثم الفئة المناسبة، وسيتم تجهيز طلب واتس أب مباشرة برقم المتجر.
            </p>
          </div>
        </div>
      </section>

      <section className="container-main px-4 py-10 sm:px-6 lg:px-8">
        {cardsQuery.isLoading ? (
          <GiftCardGridSkeleton />
        ) : cardsQuery.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
            <p>تعذر تحميل بطاقات الهدايا الآن.</p>
            <button
              type="button"
              onClick={() => void cardsQuery.refetch()}
              className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-black text-white transition hover:bg-red-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : sortedCards.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <Gift className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="font-bold text-slate-900">
              لا توجد بطاقات متاحة الآن.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {availableCards.length > 0 && (
              <section>
                <h2 className="mb-5 text-2xl font-black text-slate-950">
                  متوفر الآن
                </h2>
                {renderCards(availableCards, 0)}
              </section>
            )}

            {comingSoonCards.length > 0 && (
              <section>
                <h2 className="mb-5 text-2xl font-black text-slate-950">
                  قريبًا
                </h2>
                {renderCards(comingSoonCards, availableCards.length)}
              </section>
            )}

            {unavailableCards.length > 0 && (
              <section>
                <h2 className="mb-5 text-2xl font-black text-slate-950">
                  غير متوفر
                </h2>
                {renderCards(
                  unavailableCards,
                  availableCards.length + comingSoonCards.length,
                )}
              </section>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
