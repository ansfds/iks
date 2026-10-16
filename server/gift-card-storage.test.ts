import { afterEach, describe, expect, it, vi } from "vitest";
import { withGiftCardStorage } from "./gift-card-storage";

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("gift-card storage safety", () => {
  it("never returns an old local catalog after a production database failure", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("GIFT_CARDS_STORAGE", "auto");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const local = vi.fn(async () => ["old prices"]);
    await expect(withGiftCardStorage("list", async () => { throw new Error("Failed query ECONNREFUSED"); }, local)).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(local).not.toHaveBeenCalled();
  });
  it("allows the existing development fallback", async () => {
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("GIFT_CARDS_STORAGE", "auto");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(withGiftCardStorage("list", async () => { throw new Error("ECONNREFUSED"); }, async () => ["local"])).resolves.toEqual(["local"]);
  });
  it("uses explicitly selected local storage without attempting MySQL", async () => {
    vi.stubEnv("GIFT_CARDS_STORAGE", "local"); vi.stubEnv("VERCEL", "0");
    const db = vi.fn();
    await expect(withGiftCardStorage("list", db, async () => ["local"])).resolves.toEqual(["local"]);
    expect(db).not.toHaveBeenCalled();
  });
  it("rejects local storage on ephemeral serverless hosting", async () => {
    vi.stubEnv("GIFT_CARDS_STORAGE", "local"); vi.stubEnv("VERCEL", "1");
    const local = vi.fn();
    await expect(withGiftCardStorage("admin update", vi.fn(), local)).rejects.toThrow("persistent Node server");
    expect(local).not.toHaveBeenCalled();
  });
});
