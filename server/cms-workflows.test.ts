import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./router";
import { bundledSnapshot, installTestRepository } from "./cms/store";
import { validateContent, type ContentDocument } from "./cms/document";
import type { ContentAsset, ContentRepository } from "./cms/github";

let document: ContentDocument,
  revision: string,
  fail: boolean,
  commits: number,
  assets: ContentAsset[];
const sha = (value: string) => createHash("sha1").update(value).digest("hex");
const store: ContentRepository = {
  async read() {
    return { document: structuredClone(document), revision };
  },
  async write(value, expected, _message, uploaded = []) {
    if (fail)
      throw new TRPCError({ code: "TIMEOUT", message: "GitHub unreachable" });
    if (expected !== revision) throw new TRPCError({ code: "CONFLICT" });
    document = validateContent(structuredClone(value));
    revision = sha(JSON.stringify(document));
    assets.push(...uploaded);
    commits++;
    return { commit: sha("commit-" + commits), revision };
  },
};
function caller(editor = true, expected = revision) {
  return appRouter.createCaller({
    req: new Request("http://localhost/api/trpc", {
      method: "POST",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        "x-admin-request": "1",
        "x-cms-editor": editor ? "1" : "0",
        "x-cms-revision": expected,
      },
    }),
    resHeaders: new Headers(),
    ...(editor
      ? { user: { id: 1, name: "Owner", role: "admin" as const } }
      : {}),
  });
}
beforeEach(() => {
  document = bundledSnapshot().document;
  revision = sha(JSON.stringify(document));
  fail = false;
  commits = 0;
  assets = [];
  installTestRepository(store);
});
afterEach(() => {
  installTestRepository();
  vi.unstubAllEnvs();
});

describe("Git CMS content workflows and atomic request boundaries", () => {
  it('keeps inactive denominations in Admin while excluding them from every public card response',async()=>{
    const row=document.collections.giftCardDenominations[0];
    const card=document.collections.giftCards.find(c=>c.id===row.giftCardId)!;
    await caller().giftCards.admin.denominations.update({id:row.id,isActive:false});
    expect((await caller().giftCards.admin.getById({id:card.id}))?.denominations.some(d=>d.id===row.id&&d.isActive===false)).toBe(true);
    expect((await caller(false).giftCards.bySlug({slug:card.slug}))?.denominations.some(d=>d.id===row.id)).toBe(false);
    expect((await caller(false).giftCards.list()).flatMap(c=>c.denominations).some(d=>d.id===row.id)).toBe(false);
    await caller().giftCards.admin.denominations.update({id:row.id,isMostPopular:true});
    expect(document.collections.giftCardDenominations.find(d=>d.id===row.id)?.isActive).toBe(false);
    await caller().giftCards.admin.denominations.update({id:row.id,isActive:true});
    expect((await caller(false).giftCards.bySlug({slug:card.slug}))?.denominations.some(d=>d.id===row.id)).toBe(true);
  });
  it('saves visual text and image in one atomic change, and rejects an invalid batch without partial writes',async()=>{
    await caller().siteContent.admin.saveBatch({changes:[{key:'mission_description',value:'رسالة محدثة'},{key:'mission_image',value:'/images/alwaseet-libya-cairo.jpg'}]});
    expect(commits).toBe(1);
    expect((await caller(false).siteContent.public()).mission_description).toBe('رسالة محدثة');
    const before=JSON.stringify(document);
    await expect(caller().siteContent.admin.saveBatch({changes:[{key:'mission_description',value:'Unsaved'},{key:'mission_image',value:'javascript:alert(1)'}]})).rejects.toMatchObject({code:'BAD_REQUEST'});
    expect(JSON.stringify(document)).toBe(before);expect(commits).toBe(1);
  });
  it("preserves the public catalog and seeded image inheritance without any database", async () => {
    const api = caller(false);
    const cards = await api.giftCards.list();
    expect(cards).toHaveLength(9);
    expect(cards.find(row => row.slug === "xbox")?.imageUrl).toBeNull();
    for (const slug of ["playstation", "xbox", "shein"]) {
      const detail = await api.giftCards.bySlug({ slug });
      expect(detail?.card.status).toBe("AVAILABLE");
      expect(
        detail?.denominations.every(row => row.sellingPriceLyd === null && row.manualSellingPriceLyd === null && row.specialPriceUsd === null)
      ).toBe(true);
    }
    expect((await api.finance.accounts.list()).length).toBe(4);
  });
  it("creates, edits, hides and deletes a bank account without resetting other fields", async () => {
    const created = await caller().finance.admin.bankAccounts.create({
      countryId: 1,
      currencyId: 1,
      bankNameAr: "مصرف جديد",
      accountName: "Public owner",
      accountNumber: "000123",
      slug: "new-bank",
      sortOrder: 9,
      isActive: false,
    });
    expect(commits).toBe(1);
    await caller().finance.admin.bankAccounts.update({
      id: created.id,
      bankNameAr: "مصرف معدّل",
    });
    let row = document.collections.bankAccounts.find(
      row => row.id === created.id
    )!;
    expect(row.isActive).toBe(false);
    expect(row.sortOrder).toBe(9);
    expect(row.accountNumber).toBe("000123");
    expect(
      (await caller().finance.accounts.list()).some(
        row => row.id === created.id
      )
    ).toBe(false);
    await caller().finance.admin.bankAccounts.update({
      id: created.id,
      isActive: true,
    });
    expect(
      (await caller().finance.accounts.list()).some(
        row => row.id === created.id && row.bankNameAr === "مصرف معدّل"
      )
    ).toBe(true);
    await caller().finance.admin.bankAccounts.update({
      id: created.id,
      isActive: false,
    });
    await caller().finance.admin.bankAccounts.delete({ id: created.id });
    const next = await caller().finance.admin.bankAccounts.create({
      countryId: 1,
      currencyId: 1,
      bankNameAr: "Another",
      accountName: "Owner",
      accountNumber: "002",
      slug: "another",
    });
    expect(next.id).toBeGreaterThan(created.id);
    row = document.collections.bankAccounts.find(row => row.id === created.id)!;
    expect(row).toBeUndefined();
  });
  it("preserves gift cards, categories, availability, ordering and image overrides", async () => {
    const card = await caller().giftCards.admin.create({
      name: "New",
      displayName: "New card",
      slug: "new-card",
      status: "AVAILABLE",
      regionCode: "GLOBAL",
      regionLabel: "Global",
      sortOrder: 12,
      currency: "EUR",
      imageUrl: "https://example.com/card.png",
    });
    const denomination = await caller().giftCards.admin.denominations.create({
      giftCardId: card.id,
      faceValue: 50,
      manualSellingPriceLyd: 250,
      isAvailable: true,
    });
    await caller().giftCards.admin.update({
      id: card.id,
      displayName: "Edited",
    });
    const row = document.collections.giftCards.find(row => row.id === card.id)!;
    expect(row.status).toBe("AVAILABLE");
    expect(row.sortOrder).toBe(12);
    expect(row.currency).toBe("EUR");
    expect(row.regionCode).toBe("GLOBAL");
    let detail = await caller().giftCards.admin.getById({ id: card.id });
    expect(detail?.denominations[0].sellingPriceLyd).toBe("250.000");
    expect(detail?.card.imageUrl).toBe("https://example.com/card.png");
    await caller().giftCards.admin.denominations.update({
      id: denomination.id,
      manualSellingPriceLyd: 275,
      isAvailable: false,
      isMostPopular: true,
      highlightEffect: "FLAME",
    });
    detail = await caller().giftCards.admin.getById({ id: card.id });
    expect(detail?.denominations[0].sellingPriceLyd).toBe("275.000");
    expect(detail?.denominations[0].isAvailable).toBe(false);
    await caller().giftCards.admin.denominations.update({
      id: denomination.id,
      manualSellingPriceLyd: null,
    });
    detail = await caller().giftCards.admin.getById({ id: card.id });
    expect(detail?.denominations[0].sellingPriceLyd).toBe("500.000");
    expect(detail?.denominations[0].highlightEffect).toBe("FLAME");
    expect(detail?.denominations[0].isAvailable).toBe(false);
    for (const status of ["COMING_SOON", "UNAVAILABLE", "HIDDEN"] as const) {
      await caller().giftCards.admin.update({ id: card.id, status });
      const value = await caller().giftCards.bySlug({ slug: "new-card" });
      if (status === "HIDDEN") expect(value).toBeNull();
      else expect(value?.card.status).toBe(status);
    }
    await caller().giftCards.admin.delete({ id: card.id });
    expect(
      document.collections.giftCardDenominations.some(
        row => row.giftCardId === card.id
      )
    ).toBe(false);
  });
  it("updates gift pricing and WhatsApp settings together in one confirmed commit", async () => {
    await caller().giftCards.admin.settings.update({
      whatsappNumber: "218935095091",
      rate10To100: 11,
      rateAbove100: 10.1,
      homeGiftCardsBackgroundUrl: "https://example.com/background.png",
    });
    expect(commits).toBe(1);
    expect((await caller().giftCards.admin.settings.get()).rate10To100).toBe(11);
    expect(
      (await caller().giftCards.settings()).homeGiftCardsBackgroundUrl
    ).toBe("https://example.com/background.png");
  });
  it("saves phone lists, text, images and visibility through the existing CMS contracts", async () => {
    for (const [key, value] of [
      [
        "site_phones",
        JSON.stringify([{ number: "0935095091", visible: true }]),
      ],
      ["hero_title", "عنوان جديد"],
      ["hero_image", "/images/hero.png"],
      ["section_hero", "false"],
    ] as const) {
      await caller().siteContent.admin.save({ key, value });
      expect((await caller().siteContent.public())[key]).toBe(value);
    }
    const reloaded = await caller().siteContent.admin.list();
    expect(
      reloaded.some(
        row => row.key === "hero_title" && row.value === "عنوان جديد"
      )
    ).toBe(true);
  });
  it("serves saved content to public requests immediately without a rebuild", async () => {
    await caller().siteContent.admin.save({
      key: "site_address",
      value: "Changed draft address",
    });
    expect((await caller().siteContent.public()).site_address).toBe(
      "Changed draft address"
    );
    expect((await caller(false).siteContent.public()).site_address).toBe(
      "Changed draft address"
    );
  });
  it("keeps services and informational financial calculators working", async () => {
    await caller().finance.admin.currencies.update({
      id: 1,
      calculatorRate: 6,
    });
    const service = await caller().finance.admin.services.create({
      nameAr: "خدمة تحويل",
      isCalculatorEnabled: true,
      calculatorCurrencyId: 1,
      calculatorRateType: "calculator",
    });
    await caller().finance.admin.commissionRules.create({
      serviceId: service.id,
      minimumAmount: 1,
      maximumAmount: 1000,
      commissionType: "fixed",
      commissionValue: 5,
    });
    const result = await caller().finance.calculate({
      serviceId: service.id,
      amount: 100,
    });
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.totalAmount).toBe(605);
    await caller().finance.admin.services.update({
      id: service.id,
      isActive: false,
    });
    expect(
      (await caller().finance.overview()).services.some(
        row => row.id === service.id
      )
    ).toBe(false);
    expect(
      (await caller().finance.calculate({ serviceId: service.id, amount: 100 }))
        .status
    ).toBe("unavailable");
    await caller().finance.admin.services.delete({ id: service.id });
    expect(document.collections.commissionRules).toHaveLength(0);
  });
  it("rejects overlapping ranges and rolls back the entire edit", async () => {
    const service = await caller().finance.admin.services.create({
      nameAr: "Calculator",
    });
    await caller().finance.admin.commissionRules.create({
      serviceId: service.id,
      minimumAmount: 1,
      maximumAmount: 100,
      commissionType: "fixed",
      commissionValue: 5,
    });
    const previous = JSON.stringify(document),
      savedCommits = commits;
    await expect(
      caller().finance.admin.commissionRules.create({
        serviceId: service.id,
        minimumAmount: 50,
        maximumAmount: 150,
        commissionType: "fixed",
        commissionValue: 5,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(JSON.stringify(document)).toBe(previous);
    expect(commits).toBe(savedCommits);
  });
  it("rejects stale edits and two concurrent editors cannot overwrite each other", async () => {
    const old = revision;
    await caller().siteContent.admin.save({
      key: "hero_title",
      value: "First editor",
    });
    await expect(
      caller(true, old).siteContent.admin.save({
        key: "hero_title",
        value: "Second editor",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const expected = revision;
    const results = await Promise.allSettled([
      caller(true, expected).siteContent.admin.save({
        key: "hero_title",
        value: "Concurrent A",
      }),
      caller(true, expected).siteContent.admin.save({
        key: "hero_title",
        value: "Concurrent B",
      }),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
  });
  it("never reports a save or updates data when GitHub fails", async () => {
    const previous = JSON.stringify(document);
    fail = true;
    await expect(
      caller().siteContent.admin.save({ key: "hero_title", value: "Unsaved" })
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(commits).toBe(0);
    expect(JSON.stringify(document)).toBe(previous);
  });
  it("rejects duplicate slugs, missing parents, unsafe media, unknown settings and secret-looking content", async () => {
    await expect(
      caller().finance.admin.bankAccounts.create({
        countryId: 999,
        currencyId: 1,
        bankNameAr: "Bank",
        accountName: "Owner",
        accountNumber: "1",
        slug: "missing",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller().giftCards.admin.create({
        name: "Duplicate",
        displayName: "Duplicate",
        slug: "xbox",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      caller().siteContent.admin.save({
        key: "hero_image",
        value: "file:///private.png",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller().finance.admin.settings.upsert({
        key: "site_admin_password",
        value: "secret",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller().siteContent.admin.save({
        key: "hero_title",
        value: "ghp_" + "a".repeat(30),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(commits).toBe(0);
  });
  it("saves a validated image and the audit entry in one Git commit without local file writes", async () => {
    const base64 = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]).toString(
      "base64"
    );
    const result = await caller().cms.uploadImage({
      mime: "image/png",
      base64,
    });
    expect(result.url).toMatch(/^\/images\/cms\/[a-f0-9]{64}\.png$/);
    expect(assets[0].path).toBe("public" + result.url);
    expect(commits).toBe(1);
    await expect(
      caller().cms.uploadImage({
        mime: "image/png",
        base64: Buffer.from("<script>x</script>").toString("base64"),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("refuses to commit customer messages to a public repository", async () => {
    await expect(
      caller(false).contact.submit({
        studentName: "Private",
        parentName: "Private",
        email: "private@example.com",
        message: "Private",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(commits).toBe(0);
    expect(JSON.stringify(document)).not.toContain("private@example.com");
  });
});
