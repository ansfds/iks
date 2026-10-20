import { partialInput } from "./partial-input";
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { readContent, insertRow, updateRow, deleteRow } from "./cms/store";
import { optionalImageUrlInput } from "./media-url";
const fields = z
  .object({
    title: z.string().min(1).max(255),
    titleAr: z.string().max(255).optional(),
    excerpt: z.string().max(24000).optional(),
    excerptAr: z.string().max(24000).optional(),
    content: z.string().min(1).max(24000),
    contentAr: z.string().max(24000).optional(),
    imageUrl: optionalImageUrlInput,
    eventDate: z.coerce.date().optional(),
  })
  .strict();
const id = z.object({ id: z.number().int().positive() });
export const newsRouter = createRouter({
  list: publicQuery
    .input(
      z
        .object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().min(1).max(100).default(10),
          type: z.enum(["news", "events", "all"]).default("all"),
        })
        .optional()
    )
    .query(({ input }) => {
      const rows = readContent()
        .collections.newsEvents.filter(
          row =>
            row.isPublished &&
            (!input ||
              input.type === "all" ||
              (input.type === "events"
                ? row.eventDate !== null
                : row.eventDate === null))
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const page = input?.page || 1,
        limit = input?.limit || 10;
      return {
        items: rows.slice((page - 1) * limit, page * limit),
        total: rows.length,
        page,
        totalPages: Math.ceil(rows.length / limit),
      };
    }),
  getById: publicQuery
    .input(id)
    .query(
      ({ input }) =>
        readContent().collections.newsEvents.find(
          row => row.id === input.id && row.isPublished
        ) ?? null
    ),
  create: adminQuery
    .input(fields)
    .mutation(({ input }) => ({
      id: insertRow("newsEvents", input).id,
      ...input,
    })),
  update: adminQuery
    .input(
      partialInput(fields).extend({
        id: z.number().int().positive(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...v } = input;
      updateRow("newsEvents", id, v);
      return { success: true };
    }),
  delete: adminQuery.input(id).mutation(({ input }) => {
    deleteRow("newsEvents", input.id);
    return { success: true };
  }),
});
