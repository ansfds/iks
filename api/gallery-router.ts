import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { galleryItems } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export const galleryRouter = createRouter({
  list: publicQuery
    .input(
      z.object({ category: z.string().optional() }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const items = await db
        .select()
        .from(galleryItems)
        .where(eq(galleryItems.isActive, true))
        .orderBy(asc(galleryItems.sortOrder));

      if (input?.category && input.category !== "all") {
        return items.filter((item) => item.category === input.category);
      }

      return items;
    }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        imageUrl: z.string().min(1),
        category: z.string().default("all"),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(galleryItems).values({
        title: input.title,
        titleAr: input.titleAr,
        description: input.description,
        descriptionAr: input.descriptionAr,
        imageUrl: input.imageUrl,
        category: input.category,
        sortOrder: input.sortOrder,
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(galleryItems).set(data).where(eq(galleryItems.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(galleryItems).where(eq(galleryItems.id, input.id));
      return { success: true };
    }),
});
