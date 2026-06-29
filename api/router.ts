import { authRouter } from "./auth-router";
import { contactRouter } from "./contact-router";
import { galleryRouter } from "./gallery-router";
import { newsRouter } from "./news-router";
import { testimonialRouter } from "./testimonial-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  contact: contactRouter,
  gallery: galleryRouter,
  news: newsRouter,
  testimonial: testimonialRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
