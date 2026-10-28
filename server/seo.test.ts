import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { bundledSnapshot, installTestRepository } from './cms/store';
const store = vi.hoisted(() => ({ list: vi.fn(), bySlug: vi.fn() }));
vi.mock("./router", () => ({ appRouter: { createCaller: () => ({giftCards:store}) } }));
import { dynamicSitemap, seoResponse } from "./seo";

beforeEach(()=>installTestRepository({read:async()=>bundledSnapshot(),write:async()=>{throw Error('read only');}}));
afterEach(() => { installTestRepository(); vi.resetAllMocks(); vi.restoreAllMocks(); });
const template = async () => '<html lang="ar" dir="rtl"><head></head><body><div id="root"></div></body></html>';
describe("public SEO responses", () => {
  it("includes configured available cards in the sitemap", async () => {
    store.list.mockResolvedValue([{ slug: "brand-new-card", status: "AVAILABLE", updatedAt: new Date("2026-10-16T08:00:00Z") }, { slug: "hidden-card", status: "HIDDEN" }]);
    const xml = await dynamicSitemap();
    expect(xml).toContain("/gift-cards/brand-new-card");
    expect(xml).not.toContain("/gift-cards/hidden-card");
    expect(xml).not.toContain("/admin");
  });
  it("returns 404 and noindex for a missing card", async () => {
    store.bySlug.mockResolvedValue(null);
    const response = await seoResponse("/gift-cards/missing", template);
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });
  it("uses the actual custom card name in social metadata", async () => {
    store.bySlug.mockResolvedValue({ card: { slug: "custom-card", displayName: "Custom Store", status: "AVAILABLE" } });
    const response = await seoResponse("/gift-cards/custom-card", template);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Custom Store Gift Cards");
  });
  it("marks catalog failures temporarily unavailable without serving stale metadata", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    store.bySlug.mockRejectedValue(new Error("Database unavailable"));
    const response = await seoResponse("/gift-cards/xbox", template);
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
  });
});
