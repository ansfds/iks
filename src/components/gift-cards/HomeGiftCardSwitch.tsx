import { Link } from "react-router";
import { ArrowLeft, Gift, Landmark } from "lucide-react";
import { GIFT_CARD_IMAGES } from "@/config/gift-card-images";
import { SITE_IMAGES } from "@/config/site-images";
import { resolveImageUrl } from "@/lib/image-utils";
import { trpc } from "@/providers/trpc";

function SectionTile({
  href,
  label,
  icon: Icon,
  imageUrl,
}: {
  href: string;
  label: string;
  icon: typeof Gift;
  imageUrl: string;
}) {
  return (
    <Link
      to={href}
      className="group relative flex min-h-52 overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.82), rgba(2,6,23,.42)), url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        <Icon className="h-9 w-9 text-cyan-200" />
        <div>
          <h2 className="text-3xl font-black tracking-normal">{label}</h2>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-100">
            فتح
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HomeGiftCardSwitch() {
  const settingsQuery = trpc.giftCards.settings.useQuery(undefined, {
    staleTime: 60_000,
  });

  const giftCardBackground =
    resolveImageUrl(
      settingsQuery.data?.homeGiftCardsBackgroundUrl,
      GIFT_CARD_IMAGES.playstation.backgroundImage,
      GIFT_CARD_IMAGES.playstation.localFallback,
    );
  const servicesBackground =
    resolveImageUrl(
      settingsQuery.data?.homeServicesBackgroundUrl,
      SITE_IMAGES.finance.transferHero,
      SITE_IMAGES.finance.fallbackTransferHero,
    );

  return (
    <section className="bg-white py-10 md:py-12" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <SectionTile
            href="/gift-cards"
            label="Gift Card"
            icon={Gift}
            imageUrl={giftCardBackground}
          />
          <SectionTile
            href="/curriculum"
            label="الخدمات المالية"
            icon={Landmark}
            imageUrl={servicesBackground}
          />
        </div>
      </div>
    </section>
  );
}
