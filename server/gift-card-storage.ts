import { TRPCError } from "@trpc/server";

// Production uses MySQL. Local JSON is an explicitly selected Node-only store.
export async function withGiftCardStorage<T>(
  action: string,
  dbAction: () => Promise<T>,
  localAction: () => Promise<T>,
): Promise<T> {
  const mode = process.env.GIFT_CARDS_STORAGE || (process.env.NODE_ENV === "production" ? "mysql" : "auto");
  if (!["mysql", "local", "auto"].includes(mode)) {
    throw new Error("GIFT_CARDS_STORAGE must be mysql, local, or auto");
  }
  if (mode === "local") {
    if (process.env.VERCEL === "1") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Local gift-card storage requires a persistent Node server; configure MySQL for serverless hosting." });
    }
    return localAction();
  }
  try {
    return await dbAction();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
    const detail = [error instanceof Error ? error.message : String(error), cause?.code, cause?.message].filter(Boolean).join(" | ");
    // Never silently substitute an old catalog or write to ephemeral serverless disk.
    if (mode === "auto" && process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1" && /ECONNREFUSED|ER_NO_SUCH_TABLE|doesn't exist|Unknown column|Failed query/i.test(detail) && !/ER_DUP_ENTRY/i.test(detail)) {
      console.warn(`[gift-cards] ${action}: MySQL unavailable; using development JSON storage.`);
      return localAction();
    }
    console.error(`[gift-cards] ${action}: MySQL request failed. Check DATABASE_URL and gift-card migrations.`, error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذر تحميل بطاقات الهدايا الآن. يرجى إعادة المحاولة.", cause: error });
  }
}
