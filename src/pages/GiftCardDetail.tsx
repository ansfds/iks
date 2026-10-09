import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Flame,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { GiftCardImage } from "@/components/gift-cards/GiftCardImage";
import { getGiftCardImages } from "@/config/gift-card-images";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createGiftCardWhatsAppUrl,
  formatFaceValue,
  formatLyd,
  giftCardStatusLabels,
  hasValidLydPrice,
} from "@/lib/giftCards";
import { resolveImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { trpc } from "@/providers/trpc";

function DetailSkeleton() {
  return (
    <div className="container-main grid gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
      <Skeleton className="aspect-[16/11] rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-3 gap-3 pt-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function getSpecialSavings(denomination: {
  faceValue: string | number;
  specialPriceUsd?: string | number | null;
}) {
  if (!denomination.specialPriceUsd) return null;
  const faceValue = Number(denomination.faceValue);
  const specialPrice = Number(denomination.specialPriceUsd);
  if (!Number.isFinite(faceValue) || !Number.isFinite(specialPrice)) return null;
  const savings = faceValue - specialPrice;
  return savings > 0 ? savings : null;
}

function getWhatsAppCardName(displayName: string) {
  return displayName.replace(/\s*Gift Card$/i, "").trim();
}

export default function GiftCardDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const cardQuery = trpc.giftCards.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(slug), staleTime: 20_000 },
  );

  const data = cardQuery.data;
  const card = data?.card;
  const denominations = data?.denominations ?? [];
  const selectedDenomination =
    denominations.find((denomination) => denomination.id === selectedId) ?? null;
  const selectedPrice = formatLyd(selectedDenomination?.sellingPriceLyd);
  const canBuy =
    card?.status === "AVAILABLE" &&
    selectedDenomination?.isAvailable &&
    hasValidLydPrice(selectedDenomination.sellingPriceLyd);

  const whatsappUrl =
    card && selectedDenomination && selectedPrice && data?.settings
      ? createGiftCardWhatsAppUrl({
          phone: data.settings.whatsappNumber,
          cardName: getWhatsAppCardName(card.displayName),
          regionLabel: card.regionLabel,
          faceValue: selectedDenomination.faceValue,
          currency: selectedDenomination.currency,
          priceLyd: selectedPrice,
        })
      : "";

  if (cardQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16" dir="rtl">
        <DetailSkeleton />
      </div>
    );
  }

  if (cardQuery.error || !data || !card) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 text-center" dir="rtl">
        <h1 className="text-3xl font-black text-slate-950">
          بطاقة الهدية غير موجودة
        </h1>
        <Link
          to="/gift-cards"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-black text-white"
        >
          العودة إلى Gift Cards
          <ArrowLeft size={16} />
        </Link>
      </div>
    );
  }

  const isPurchasableCard = card.status === "AVAILABLE";
  const images = getGiftCardImages(card.slug);
  const cardImage = resolveImageUrl(
    card.imageUrl,
    images.cardImage,
    images.localFallback,
  );
  const backgroundImage = resolveImageUrl(
    card.backgroundUrl,
    images.backgroundImage,
    images.localFallback,
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-16" dir="rtl">
      <section
        className="relative overflow-hidden bg-slate-950"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.86), rgba(2,6,23,.62)), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container-main px-4 py-14 sm:px-6 lg:px-8">
          <Link
            to="/gift-cards"
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            كل Gift Cards
          </Link>
          <h1 className="text-4xl font-black tracking-normal text-white sm:text-5xl">
            {card.displayName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white">
              <ShieldCheck size={16} />
              {card.regionLabel}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">
              {giftCardStatusLabels[card.status]}
            </span>
          </div>
        </div>
      </section>

      <section className="container-main grid gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/11] bg-slate-100">
              <GiftCardImage
                src={cardImage}
                fallbackSrc={images.localFallback}
                alt={`صورة ${card.displayName}`}
                title={card.displayName}
                loading="eager"
              />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  السعر الحالي:
                </p>
                <div className="mt-2 min-h-12">
                  {selectedPrice ? (
                    <div className="space-y-2">
                      <p className="text-3xl font-black text-slate-950">
                        {selectedPrice}
                      </p>
                      {selectedDenomination?.specialPriceUsd && (
                        <p className="text-sm font-black text-emerald-700">
                          السعر المخفض:{" "}
                          {formatFaceValue(
                            selectedDenomination.specialPriceUsd,
                            selectedDenomination.currency,
                          )}
                        </p>
                      )}
                    </div>
                  ) : selectedDenomination ? (
                    <p className="rounded-md bg-amber-50 p-3 text-sm font-bold leading-7 text-amber-800">
                      السعر غير متوفر حاليًا
                    </p>
                  ) : (
                    <p className="rounded-md bg-slate-100 p-3 text-sm font-bold text-slate-600">
                      اختر الفئة لمعرفة السعر
                    </p>
                  )}
                </div>
              </div>

              <p className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm font-bold leading-7 text-blue-800">
                السعر يتغير كل لحظة ويتم احتساب السعر النهائي وقت الشراء فقط.
              </p>
              <p className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-800">
                إتمام عملية الشراء تتم داخل واتس أب المتجر فقط حسب طريقة الدفع ( حوالة - كاش ).
              </p>
            </div>
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-950">
              اختر الفئة
            </h2>
            {card.description && (
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                {card.description}
              </p>
            )}
          </div>

          {!isPurchasableCard ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-900">
                {giftCardStatusLabels[card.status]}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                هذه البطاقة غير قابلة للشراء حاليًا.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {denominations.map((denomination) => {
                  const hasPrice = hasValidLydPrice(denomination.sellingPriceLyd);
                  const disabled = !denomination.isAvailable;
                  const selected = selectedId === denomination.id;
                  const savings = getSpecialSavings(denomination);

                  return (
                    <button
                      key={denomination.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedId(denomination.id)}
                      className={cn(
                        "relative min-h-20 overflow-hidden rounded-lg border bg-white px-3 py-4 text-center text-slate-950 shadow-sm transition focus:outline-none focus:ring-4 focus:ring-blue-200",
                        "hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md",
                        selected &&
                          "border-blue-600 bg-blue-50 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
                        disabled &&
                          "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 hover:translate-y-0 hover:border-slate-200 hover:shadow-sm",
                        denomination.highlightEffect === "FLAME" &&
                          !disabled &&
                          "gift-card-flame border-orange-300",
                      )}
                      aria-pressed={selected}
                    >
                      {denomination.highlightEffect === "FLAME" && !disabled && (
                        <Flame className="absolute left-2 top-2 h-4 w-4 text-orange-500" />
                      )}
                      {denomination.isMostPopular && (
                        <span className="absolute right-2 top-2 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black text-white">
                          الأكثر طلبًا
                        </span>
                      )}
                      {savings && !denomination.isMostPopular && (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                          عرض
                        </span>
                      )}
                      <span className="block pt-4 text-2xl font-black tracking-normal">
                        {formatFaceValue(denomination.faceValue, denomination.currency)}
                      </span>
                      {savings && (
                        <span className="mt-2 block text-xs font-black text-emerald-700">
                          وفر {formatFaceValue(savings, denomination.currency)}
                        </span>
                      )}
                      {!denomination.isAvailable && (
                        <span className="mt-2 block text-xs font-black text-red-500">
                          غير متوفر
                        </span>
                      )}
                      {denomination.isAvailable && !hasPrice && (
                        <span className="mt-2 block text-xs font-black text-amber-600">
                          السعر غير متوفر
                        </span>
                      )}
                      {selected && (
                        <CheckCircle2 className="absolute bottom-2 left-2 h-4 w-4 text-blue-700" />
                      )}
                    </button>
                  );
                })}
              </div>

              {denominations.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="font-black text-slate-900">
                    لم تتم إضافة فئات لهذه البطاقة بعد.
                  </p>
                </div>
              )}

              <div className="mt-8 border-t border-slate-100 pt-6">
                {canBuy && whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
                  >
                    <MessageCircle size={20} />
                    الشراء
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-6 py-3 text-base font-black text-slate-500 sm:w-auto"
                  >
                    <MessageCircle size={20} />
                    اختر فئة بسعر صالح
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
