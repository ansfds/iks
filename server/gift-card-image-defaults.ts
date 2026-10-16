// Compatibility for old seeded data. These are historical defaults, not Admin overrides.
// New seeds store null and inherit the current URLs from src/config/gift-card-images.ts.
const legacyPlaceholders: Record<string, string> = {
  playstation: "003087/ffffff?text=PlayStation+Store",
  xbox: "107c10/ffffff?text=Xbox",
  steam: "171a21/ffffff?text=Steam",
  apple: "1d1d1f/ffffff?text=Apple",
  "google-play": "1a73e8/ffffff?text=Google+Play",
  nintendo: "e60012/ffffff?text=Nintendo",
  roblox: "232527/ffffff?text=Roblox",
  razer: "0b0f0a/44d62c?text=Razer+Gold",
  shein: "111111/ffffff?text=SHEIN",
};

function legacyCardImages(slug: string) {
  if (!Object.hasOwn(legacyPlaceholders, slug)) return [];
  const placeholder = legacyPlaceholders[slug];
  const urls = [`/images/gift-cards/${slug}.svg`];
  if (placeholder) {
    urls.push(`https://placehold.co/1200x760/${placeholder}`, `https://placehold.co/1600x900/${placeholder}`);
  }
  if (slug === "playstation") urls.push("https://gmedia.playstation.com/is/image/SIEPDC/gift-card-faceplate-shapes-image-block-en-01-07july23?$1600px$");
  if (slug === "xbox") {
    urls.push(
      "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/455251-Card-Feature-Xbox-Game-Pass?wid=517&hei=291&fit=crop",
      "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/455251-Card-Feature-Xbox-Game-Pass?wid=1600&hei=900&fit=crop",
    );
  }
  return urls;
}

export function imageOverride(value: string | null | undefined, seedUrls: readonly string[], explicitlyCustomized = false): string | null {
  const url = value?.trim();
  if (!url) return null;
  return !explicitlyCustomized && seedUrls.includes(url) ? null : url;
}

export function inheritGiftCardImages<T extends {
  slug: string;
  imageUrl: string | null;
  backgroundUrl: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}>(card: T): T {
  const customized = card.updatedBy != null || card.createdBy != null;
  const seeds = legacyCardImages(card.slug);
  return {
    ...card,
    imageUrl: imageOverride(card.imageUrl, seeds, customized),
    backgroundUrl: imageOverride(card.backgroundUrl, seeds, customized),
  };
}

export function homeImageOverride(value: string | null | undefined, section: "giftCards" | "services", explicitlyCustomized = false) {
  const seeds = section === "giftCards" ? legacyCardImages("playstation") : [
    "/images/alwaseet-transfer-hero.jpg",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=85",
  ];
  return imageOverride(value, seeds, explicitlyCustomized);
}
