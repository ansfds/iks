import { Link } from "react-router";
import { ArrowLeft, Gift, Landmark } from "lucide-react";
import { GIFT_CARD_IMAGES } from "@/config/gift-card-images";
import { SITE_IMAGES } from "@/config/site-images";
import { resolveImageUrl } from "@/lib/image-utils";
import { trpc } from "@/providers/trpc";
import { useSiteContent } from "@/hooks/useSiteContent";
import { SiteBackground } from "@/components/SiteBackground";

function SectionTile({
  href,
  label,
  icon: Icon,
  imageUrl,
  fallbacks,
  editorKey,
  visible,visibilityKey,labelKey,
}: {
  href: string;
  label: string;
  icon: typeof Gift;
  imageUrl: string;
  fallbacks: string[];
  editorKey:string;
  visible:boolean;visibilityKey:string;labelKey:string;
}) {
  return (
    <Link
      data-editor-section={editorKey} data-editor-label={label} data-editor-visibility={visibilityKey} data-editor-link={editorKey.includes('gift_cards')?'/admin/gift-cards':'/admin/services'} style={{display:visible?undefined:'none'}}
      to={href}
      className="group relative flex min-h-52 overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <SiteBackground editorKey={editorKey} src={imageUrl} fallbackSources={fallbacks} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,.82),rgba(2,6,23,.42))]" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        <Icon className="h-9 w-9 text-cyan-200" />
        <div>
          <h2 data-cms-key={labelKey} className="text-3xl font-black tracking-normal">{label}</h2>
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
  const settingsQuery = trpc.giftCards.settings.useQuery(undefined, { staleTime: 0, refetchInterval: 30_000 });
  const settings = settingsQuery.data;
  const cms = useSiteContent();

  const giftCardBackground =
    resolveImageUrl(
      settings?.homeGiftCardsBackgroundUrl,
      GIFT_CARD_IMAGES.playstation.backgroundImage,
      GIFT_CARD_IMAGES.playstation.localFallback,
    );
  const servicesBackground =
    resolveImageUrl(
      settings?.homeServicesBackgroundUrl,
      SITE_IMAGES.finance.transferHero,
      SITE_IMAGES.finance.fallbackTransferHero,
    );

  return (
    <section className="bg-white py-10 md:py-12" dir="rtl">
      <div className="container-main px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <SectionTile visible={cms.isVisible('section_gift_cards')} visibilityKey="section_gift_cards" labelKey="home_gift_label"
            href="/gift-cards"
            editorKey="home_gift_cards_background_url" label={cms.value("home_gift_label","Gift Card")}
            icon={Gift}
            imageUrl={giftCardBackground}
            fallbacks={[GIFT_CARD_IMAGES.playstation.backgroundImage, GIFT_CARD_IMAGES.playstation.localFallback]}
          />
          <SectionTile visible={cms.isVisible('section_services')} visibilityKey="section_services" labelKey="home_services_label"
            href="/curriculum"
            editorKey="home_services_background_url" label={cms.value("home_services_label","الخدمات المالية")}
            icon={Landmark}
            imageUrl={servicesBackground}
            fallbacks={[SITE_IMAGES.finance.transferHero, SITE_IMAGES.finance.fallbackTransferHero]}
          />
        </div>
      </div>
    </section>
  );
}
