import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { testimonials } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export const testimonialRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const items = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(asc(testimonials.sortOrder));
    return items;
  }),

  create: adminQuery
    .input(
      z.object({
        authorName: z.string().min(1),
        authorNameAr: z.string().optional(),
        role: z.string().optional(),
        roleAr: z.string().optional(),
        quote: z.string().min(1),
        quoteAr: z.string().optional(),
        rating: z.number().min(1).max(5).default(5),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(testimonials).values({
        authorName: input.authorName,
        authorNameAr: input.authorNameAr,
        role: input.role,
        roleAr: input.roleAr,
        quote: input.quote,
        quoteAr: input.quoteAr,
        rating: input.rating,
        sortOrder: input.sortOrder,
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        authorName: z.string().optional(),
        authorNameAr: z.string().optional(),
        role: z.string().optional(),
        roleAr: z.string().optional(),
        quote: z.string().optional(),
        quoteAr: z.string().optional(),
        rating: z.number().min(1).max(5).optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(testimonials).set(data).where(eq(testimonials.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(testimonials).where(eq(testimonials.id, input.id));
      return { success: true };
    }),
});
