export function createServiceRequestWhatsAppUrl(
  input: { phone: string; serviceType: string; message: string },
  target: "app" | "web" = typeof navigator !== "undefined" &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1))
    ? "app"
    : "web"
) {
  const serviceType = input.serviceType.trim();
  const message = input.message.trim().replace(/\r\n?/g, "\n");
  const phone = input.phone.replace(/\D/g, "");
  if (!serviceType || !message || !/^\d{7,16}$/.test(phone)) {
    throw new Error(
      "A service, a note and the configured office number are required."
    );
  }
  const text = [
    "طلب خدمة جديد",
    "",
    "نوع الخدمة:",
    serviceType,
    "",
    "الملاحظة:",
    message,
  ].join("\n");
  const url = new URL(
    target === "app" ? "whatsapp://send" : "https://web.whatsapp.com/send"
  );
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  return url.toString();
}
