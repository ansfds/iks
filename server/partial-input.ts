import { z } from "zod";

// Zod 4 applies an inner default even under optional(). A PATCH must leave absent fields alone.
export function partialInput<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  const fields = Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => [
      key,
      value instanceof z.ZodDefault ? value.removeDefault() : value,
    ])
  ) as T;
  return z.object(fields).partial();
}
