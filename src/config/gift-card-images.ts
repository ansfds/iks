// ==============================
// صور بطاقات الهدايا وخلفياتها
// ==============================
// cardImage: صورة البطاقة في القائمة والتفاصيل.
// backgroundImage: خلفية أعلى صفحة تفاصيل البطاقة.
// خلفية قسم Gift Card في الرئيسية تتبع playstation.backgroundImage.
// القيم الافتراضية القديمة تتبع هذا الملف؛ رابط Admin المخصص له الأولوية.
// اترك حقل الصورة في Admin فارغًا لإعادته إلى روابط هذا الملف.
export type GiftCardImageKey =
  | "playstation"
  | "xbox"
  | "shein"
  | "steam"
  | "apple"
  | "google-play"
  | "nintendo"
  | "roblox"
  | "razer";

export type GiftCardImageEntry = {
  cardImage: string;
  backgroundImage: string;
  localFallback: string;
};

export const GIFT_CARD_IMAGES: Record<GiftCardImageKey, GiftCardImageEntry> = {
  playstation: {
    cardImage:
      "https://gmedia.playstation.com/is/image/SIEPDC/gift-card-faceplate-shapes-image-block-en-01-07july23?$1600px$",
    backgroundImage:
      "https://gmedia.playstation.com/is/image/SIEPDC/gift-card-faceplate-shapes-image-block-en-01-07july23?$1600px$",
    localFallback: "/images/gift-cards/playstation.svg",
  },
  xbox: {
    cardImage: "https://m.media-amazon.com/images/S/aplus-media-library-service-media/7dcc99ab-6ef3-439b-af61-de1e4977f44a.__CR0,0,600,450_PT0_SX600_V1___.jpg",
    backgroundImage: "https://i5-richmedia.walmartimages.com/asr-rm/de1babac-4ddc-40ce-91eb-9ccc8af137d5_video_walmart.jpg",
    localFallback: "/images/gift-cards/xbox.svg",
  },
  shein: {
    cardImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScDNGrXyBHovoG9VCoPPVPnUf8zRf_sfnDpKWHns2e5MbuF5stWcNsVfwo&s=10",
    backgroundImage: "https://placehold.co/1600x900/111111/ffffff?text=SHEIN",
    localFallback: "/images/gift-cards/shein.svg",
  },
  steam: {
    cardImage: "https://placehold.co/1200x760/171a21/ffffff?text=Steam",
    backgroundImage: "https://placehold.co/1600x900/171a21/ffffff?text=Steam",
    localFallback: "/images/gift-cards/steam.svg",
  },
  apple: {
    cardImage: "https://placehold.co/1200x760/1d1d1f/ffffff?text=Apple",
    backgroundImage: "https://placehold.co/1600x900/1d1d1f/ffffff?text=Apple",
    localFallback: "/images/gift-cards/apple.svg",
  },
  "google-play": {
    cardImage:
      "https://placehold.co/1200x760/1a73e8/ffffff?text=Google+Play",
    backgroundImage:
      "https://placehold.co/1600x900/1a73e8/ffffff?text=Google+Play",
    localFallback: "/images/gift-cards/google-play.svg",
  },
  nintendo: {
    cardImage: "https://placehold.co/1200x760/e60012/ffffff?text=Nintendo",
    backgroundImage:
      "https://placehold.co/1600x900/e60012/ffffff?text=Nintendo",
    localFallback: "/images/gift-cards/nintendo.svg",
  },
  roblox: {
    cardImage: "https://placehold.co/1200x760/232527/ffffff?text=Roblox",
    backgroundImage: "https://placehold.co/1600x900/232527/ffffff?text=Roblox",
    localFallback: "/images/gift-cards/roblox.svg",
  },
  razer: {
    cardImage: "https://placehold.co/1200x760/0b0f0a/44d62c?text=Razer+Gold",
    backgroundImage:
      "https://placehold.co/1600x900/0b0f0a/44d62c?text=Razer+Gold",
    localFallback: "/images/gift-cards/razer.svg",
  },
};

export const DEFAULT_GIFT_CARD_IMAGE = GIFT_CARD_IMAGES.playstation;

export function getGiftCardImages(slug: string | null | undefined) {
  return (
    GIFT_CARD_IMAGES[slug as GiftCardImageKey] ?? DEFAULT_GIFT_CARD_IMAGE
  );
}
