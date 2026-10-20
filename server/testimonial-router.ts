import { partialInput } from "./partial-input";
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { readContent, insertRow, updateRow, deleteRow } from "./cms/store";

const fields = z
  .object({
    authorName: z.string().min(1).max(255),
    authorNameAr: z.string().max(255).optional(),
    role: z.string().max(100).optional(),
    roleAr: z.string().max(100).optional(),
    quote: z.string().min(1).max(12000),
    quoteAr: z.string().max(12000).optional(),
    rating: z.number().int().min(1).max(5).default(5),
    sortOrder: z.number().int().default(0),
  })
  .strict();
const id = z.object({ id: z.number().int().positive() });
export const testimonialRouter = createRouter({
  list: publicQuery.query(() =>
    readContent()
      .collections.testimonials.filter(row => row.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  ),
  create: adminQuery
    .input(fields)
    .mutation(({ input }) => ({
      id: insertRow("testimonials", input).id,
      ...input,
    })),
  update: adminQuery
    .input(
      partialInput(fields).extend({
        id: z.number().int().positive(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, ...v } = input;
      updateRow("testimonials", id, v);
      return { success: true };
    }),
  delete: adminQuery.input(id).mutation(({ input }) => {
    deleteRow("testimonials", input.id);
    return { success: true };
  }),
});
