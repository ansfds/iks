import { afterEach, describe, expect, it, vi } from "vitest";
import { createServiceRequestWhatsAppUrl } from "./serviceRequest";
afterEach(() => vi.unstubAllGlobals());
const input = {
  phone: "+218 93-5095091",
  serviceType: "  شحن بطاقة + تحويل & دفع؟  ",
  message: "  ملاحظة بالعربية 🙂\r\nالوقت: 10:30 & الرمز #1  ",
};
describe("service requests through WhatsApp", () => {
  it("preserves Arabic, newlines and reserved characters after one URL decode", () => {
    const url = new URL(createServiceRequestWhatsAppUrl(input, "web"));
    expect(url.origin).toBe("https://web.whatsapp.com");
    expect(url.searchParams.get("phone")).toBe("218935095091");
    expect(url.searchParams.get("text")).toBe(
      "طلب خدمة جديد\n\nنوع الخدمة:\nشحن بطاقة + تحويل & دفع؟\n\nالملاحظة:\nملاحظة بالعربية 🙂\nالوقت: 10:30 & الرمز #1"
    );
  });
  it("selects the native mobile composer and the desktop web composer", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Windows",
      platform: "Win32",
      maxTouchPoints: 0,
    });
    expect(new URL(createServiceRequestWhatsAppUrl(input)).origin).toBe(
      "https://web.whatsapp.com"
    );
    for (const userAgent of ["Android", "iPhone"]) {
      vi.stubGlobal("navigator", { userAgent });
      expect(new URL(createServiceRequestWhatsAppUrl(input)).protocol).toBe(
        "whatsapp:"
      );
    }
    vi.stubGlobal("navigator", {
      userAgent: "Macintosh",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    expect(new URL(createServiceRequestWhatsAppUrl(input)).protocol).toBe(
      "whatsapp:"
    );
  });
  it("requires both meaningful fields and uses no invented fallback office number", () => {
    for (const invalid of [
      { serviceType: "   " },
      { message: "\n " },
      { phone: "" },
    ])
      expect(() =>
        createServiceRequestWhatsAppUrl({ ...input, ...invalid })
      ).toThrow();
  });
});
