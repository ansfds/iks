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
    cardImage: "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/455251-Card-Feature-Xbox-Game-Pass?wid=517&hei=291&fit=crop",
    backgroundImage: "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/455251-Card-Feature-Xbox-Game-Pass?wid=1600&hei=900&fit=crop",
    localFallback: "/images/gift-cards/xbox.svg",
  },
  shein: {
    cardImage: "https://placehold.co/1200x760/111111/ffffff?text=SHEIN",
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
