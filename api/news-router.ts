import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { newsEvents } from "@db/schema";
import { eq, desc, sql, isNull, isNotNull, and } from "drizzle-orm";

export const newsRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(10),
          type: z.enum(["news", "events", "all"]).default("all"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const offset = (page - 1) * limit;

      const conditions = [eq(newsEvents.isPublished, true)];

      if (input?.type === "news") {
        conditions.push(isNull(newsEvents.eventDate));
      } else if (input?.type === "events") {
        conditions.push(isNotNull(newsEvents.eventDate));
      }

      const where = conditions.length > 1 ? and(...conditions) : conditions[0];

      const items = await db
        .select()
        .from(newsEvents)
        .where(where)
        .orderBy(desc(newsEvents.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsEvents)
        .where(where);

      const total = countResult[0]?.count ?? 0;

      return {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(newsEvents)
        .where(eq(newsEvents.id, input.id));
      return result[0] ?? null;
    }),

  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        titleAr: z.string().optional(),
        excerpt: z.string().optional(),
        excerptAr: z.string().optional(),
        content: z.string().min(1),
        contentAr: z.string().optional(),
        imageUrl: z.string().optional(),
        eventDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(newsEvents).values({
        title: input.title,
        titleAr: input.titleAr,
        excerpt: input.excerpt,
        excerptAr: input.excerptAr,
        content: input.content,
        contentAr: input.contentAr,
        imageUrl: input.imageUrl,
        eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
      });
      return { id: Number(result[0].insertId), ...input };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        excerpt: z.string().optional(),
        excerptAr: z.string().optional(),
        content: z.string().optional(),
        contentAr: z.string().optional(),
        imageUrl: z.string().optional(),
        eventDate: z.string().optional().nullable(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, eventDate, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (eventDate !== undefined) {
        updateData.eventDate = eventDate ? new Date(eventDate) : null;
      }
      await db.update(newsEvents).set(updateData).where(eq(newsEvents.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(newsEvents).where(eq(newsEvents.id, input.id));
      return { success: true };
    }),
});
