import { createRouter, adminQuery } from "./middleware";
import { readContent } from "./cms/store";
export const adminRouter = createRouter({
  stats: adminQuery.query(() => {
    const c = readContent().collections;
    return {
      // Unavailable is not an empty inbox. Existing messages remain in the legacy database.
      totalContacts: null,
      unreadContacts: null,
      contactsThisMonth: null,
      contactsStorageAvailable: false,
      totalGallery: c.galleryItems.length,
      totalNews: c.newsEvents.length,
      totalTestimonials: c.testimonials.length,
      totalGiftCards: c.giftCards.length,
    };
  }),
});
