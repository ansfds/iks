import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "./middleware";
const privateStorageRequired = () => {
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "صندوق الرسائل الخاص غير متصل حاليًا؛ لم تُحفظ هذه الرسالة. تواصل عبر الهاتف أو واتساب الظاهرين في الموقع. الرسائل السابقة محفوظة في مصدرها الأصلي ولا تُنقل إلى المستودع العام.",
  });
};
export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        studentName: z.string().max(200),
        parentName: z.string().max(200),
        email: z.string().email(),
        phone: z.string().max(50).optional(),
        grade: z.string().max(80).optional(),
        message: z.string().max(4000),
        language: z.enum(["en", "ar"]).default("en"),
      })
    )
    .mutation(privateStorageRequired),
  list: adminQuery
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(privateStorageRequired),
  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(privateStorageRequired),
  markRead: adminQuery
    .input(z.object({ id: z.number(), isRead: z.boolean() }))
    .mutation(privateStorageRequired),
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(privateStorageRequired),
  stats: adminQuery.query(privateStorageRequired),
});
