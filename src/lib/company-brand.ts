// توافق لنصوص قديمة مخزّنة في Database/Admin؛ لا يغيّر الروابط أو المعرّفات.
export function withCurrentCompanyName<T extends string | null | undefined>(text: T): T {
  if (typeof text !== "string") return text;
  return text
    .replace(/الوسيط العالمي(?: للحوالات(?: المالية)?)?/g, "الوسيط المعتمد")
    .replace(/Alwaseet Global(?: Money Transfers)?|Al Waseet Al Alami|Elwaseet Alalami/gi, "ELWASEET EL-MOATAMAD") as T;
}
