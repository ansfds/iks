import { afterEach, describe, expect, it, vi } from "vitest";
import { handleVercelRequest } from "./vercel";

type BatchResult<T> = Array<{ result: { data: { json: T } } }>;

afterEach(() => vi.unstubAllEnvs());

describe("Vercel rewritten requests", () => {
  it("serves nested tRPC batches and preserves their query parameters", async () => {
    const response = await handleVercelRequest(new Request("https://example.com/api/index?__path=/api/trpc/ping,ping&batch=1&input=%7B%7D"));
    expect(response.status).toBe(200);
    const data = await response.json() as BatchResult<{ ok: boolean }>;
    expect(data).toHaveLength(2);
    expect(data.every(item => item.result.data.json.ok)).toBe(true);
  });

  it("loads the catalog and a slug through the same handler used by Vercel", async () => {
    // Use the real existing QA catalog without requiring a production database.
    vi.stubEnv("GIFT_CARDS_STORAGE", "local");
    vi.stubEnv("VERCEL", "0");
    const list = await handleVercelRequest(new Request("https://example.com/api/index?__path=/api/trpc/giftCards.list&batch=1&input=%7B%7D"));
    expect(list.status).toBe(200);
    const cards = await list.json() as BatchResult<Array<{ slug: string }>>;
    expect(cards[0].result.data.json.some(card => card.slug === "xbox")).toBe(true);

    const url = new URL("https://example.com/api/index?__path=/api/trpc/giftCards.bySlug&batch=1");
    url.searchParams.set("input", JSON.stringify({ 0: { json: { slug: "xbox" } } }));
    const detail = await handleVercelRequest(new Request(url));
    expect(detail.status).toBe(200);
    const card = await detail.json() as BatchResult<{ card: { slug: string } }>;
    expect(card[0].result.data.json.card.slug).toBe("xbox");
  });

  it("retains POST bodies and authentication for admin mutations", async () => {
    const response = await handleVercelRequest(new Request("https://example.com/api/index?__path=/api/trpc/giftCards.admin.update&batch=1", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 0: { json: { id: 1, name: "test" } } }),
    }));
    expect(response.status).toBe(401);
    const data = await response.json() as Array<{ error: { json: { data: { code: string } } } }>;
    expect(data[0].error.json.data.code).toBe("UNAUTHORIZED");
  });

  it("rejects route values that would change the origin or query", async () => {
    for (const value of ["https://example.org", "//example.org/path", "/about?admin=1", "/\\example.org"]) {
      const url = new URL("https://example.com/api/index");
      url.searchParams.set("__path", value);
      expect((await handleVercelRequest(new Request(url))).status).toBe(400);
    }
  });
});
