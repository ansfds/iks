import { createRouter, adminQuery } from "./middleware";
import { readContent } from "./cms/store";
export const adminRouter = createRouter({
  stats: adminQuery.query(() => {
    const c = readContent().collections;
    return {
      totalContacts: 0,
      unreadContacts: 0,
      contactsThisMonth: 0,
      contactsStorageAvailable: false,
      totalGallery: c.galleryItems.length,
      totalNews: c.newsEvents.length,
      totalTestimonials: c.testimonials.length,
      totalGiftCards: c.giftCards.length,
    };
  }),
});
