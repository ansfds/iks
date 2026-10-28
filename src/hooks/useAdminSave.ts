import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
export function useAdminSave() {
  const utils = trpc.useUtils();
  const done = async () => {
    await Promise.all([
      utils.giftCards.invalidate(),
      utils.finance.invalidate(),
      utils.siteContent.invalidate(),
    ]);
    toast.success("تم الحفظ بنجاح");
  };
  return {
    done,
    fail: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "تعذر حفظ التعديلات"),
  };
}
