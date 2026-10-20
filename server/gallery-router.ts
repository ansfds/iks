import { partialInput } from "./partial-input";
import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { readContent, insertRow, updateRow, deleteRow } from "./cms/store";
import { imageUrlInput } from "./media-url";
const fields = z
  .object({
    title: z.string().min(1).max(255),
    titleAr: z.string().max(255).optional(),
    description: z.string().max(24000).optional(),
    descriptionAr: z.string().max(24000).optional(),
    imageUrl: imageUrlInput,
    category: z.string().max(80).default("all"),
    sortOrder: z.number().int().default(0),
  })
  .strict();
const id = z.object({ id: z.number().int().positive() });
export const galleryRouter = createRouter({
  list: publicQuery
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ input }) =>
      readContent()
        .collections.galleryItems.filter(
          row =>
            row.isActive &&
            (!input?.category ||
              input.category === "all" ||
              row.category === input.category)
        )
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    ),
  create: adminQuery
    .input(fields)
    .mutation(({ input }) => ({
      id: insertRow("galleryItems", input).id,
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
      updateRow("galleryItems", id, v);
      return { success: true };
    }),
  delete: adminQuery.input(id).mutation(({ input }) => {
    deleteRow("galleryItems", input.id);
    return { success: true };
  }),
});
