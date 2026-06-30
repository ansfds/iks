import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { contacts } from "../db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";

export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        studentName: z.string().min(1),
        parentName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        grade: z.string().optional(),
        message: z.string().min(1),
        language: z.enum(["en", "ar"]).default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(contacts).values({
        studentName: input.studentName,
        parentName: input.parentName,
        email: input.email,
        phone: input.phone,
        grade: input.grade,
        message: input.message,
        language: input.language,
      });
      return { success: true, id: Number(result[0].insertId) };
    }),

  list: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.search) {
        conditions.push(
          like(contacts.studentName, `%${input.search}%`)
        );
      }
      if (input.isRead !== undefined) {
        conditions.push(eq(contacts.isRead, input.isRead));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(contacts)
        .where(where)
        .orderBy(desc(contacts.createdAt))
        .limit(input.limit)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(where);

      const total = countResult[0]?.count ?? 0;

      return {
        items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, input.id));
      return result[0] ?? null;
    }),

  markRead: adminQuery
    .input(z.object({ id: z.number(), isRead: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(contacts)
        .set({ isRead: input.isRead })
        .where(eq(contacts.id, input.id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(contacts).where(eq(contacts.id, input.id));
      return { success: true };
    }),

  stats: adminQuery.query(async () => {
    const db = getDb();
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.isRead, false));
    const thisMonthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(
        sql`createdAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`
      );

    return {
      total: totalResult[0]?.count ?? 0,
      unread: unreadResult[0]?.count ?? 0,
      thisMonth: thisMonthResult[0]?.count ?? 0,
    };
  }),
});
