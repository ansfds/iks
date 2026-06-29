import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { contacts, galleryItems, newsEvents, testimonials } from "@db/schema";
import { sql, eq } from "drizzle-orm";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();

    const totalContactsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);
    const unreadContactsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.isRead, false));
    const totalGalleryResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(galleryItems);
    const totalNewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsEvents);
    const totalTestimonialsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(testimonials);
    const contactsThisMonthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(sql`createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`);

    return {
      totalContacts: totalContactsResult[0]?.count ?? 0,
      unreadContacts: unreadContactsResult[0]?.count ?? 0,
      totalGallery: totalGalleryResult[0]?.count ?? 0,
      totalNews: totalNewsResult[0]?.count ?? 0,
      totalTestimonials: totalTestimonialsResult[0]?.count ?? 0,
      contactsThisMonth: contactsThisMonthResult[0]?.count ?? 0,
    };
  }),
});
