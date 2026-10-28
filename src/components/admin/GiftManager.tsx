import { useState } from "react";
import { useLocation } from "react-router";
import { ArrowRight, Flame, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { GiftCardImage } from "@/components/gift-cards/GiftCardImage";
import { getGiftCardImages } from "@/config/gift-card-images";
import { formatFaceValue } from "@/lib/giftCards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TextField,
  Toggle,
  SaveButton,
  ImageField,
  inputClass,
  buttonClass,
} from "./AdminFields";
import { useAdminSave } from "@/hooks/useAdminSave";

type Fields = Record<string, string>;
const statuses = {
  AVAILABLE: "متوفر",
  COMING_SOON: "قريبًا",
  UNAVAILABLE: "غير متوفر",
  HIDDEN: "مخفي",
};
export function GiftManager({
  markDirty,
  onNavigate,
}: {
  markDirty: (dirty: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const { pathname } = useLocation();
  const token = pathname.split("/")[3];
  const selected =
    token === "new"
      ? "new"
      : token && /^\d+$/.test(token)
        ? Number(token)
        : null;
  const cards = trpc.giftCards.admin.list.useQuery();
  const current = cards.data?.find(c => c.id === selected);
  const { done, fail } = useAdminSave();
  const create = trpc.giftCards.admin.create.useMutation(),
    update = trpc.giftCards.admin.update.useMutation(),
    remove = trpc.giftCards.admin.delete.useMutation();
  const denomCreate = trpc.giftCards.admin.denominations.create.useMutation(),
    denomUpdate = trpc.giftCards.admin.denominations.update.useMutation(),
    denomDelete = trpc.giftCards.admin.denominations.delete.useMutation();
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState(selected === "new"),
    [draft, setDraft] = useState<Fields>({
      status: "COMING_SOON",
      currency: "USD",
      regionCode: "US",
      regionLabel: "ريجن أمريكي",
      sortOrder: "0",
    }),
    [cardDirty, setCardDirty] = useState(false);
  const [denomId, setDenomId] = useState<number | "new" | null>(null),
    [denom, setDenom] = useState<Fields>({}),
    [denomDirty, setDenomDirty] = useState(false);
  const [imageValid, setImageValid] = useState(true),
    [backgroundValid, setBackgroundValid] = useState(true);
  const openCardEditor = () => {
    setDraft(
      current
        ? Object.fromEntries(
            Object.entries(current).map(([k, v]) => [k, String(v ?? "")])
          )
        : {
            name: "",
            displayName: "",
            slug: "",
            status: "COMING_SOON",
            currency: "USD",
            regionCode: "US",
            regionLabel: "ريجن أمريكي",
            sortOrder: String(cards.data?.length || 0),
          }
    );
    setEditing(true);
  };
  const change = (key: string, value: string) => {
    setDraft(d => ({ ...d, [key]: value }));
    setCardDirty(true);
    markDirty(true);
  };
  const closeEditor = () => {
    if (
      cardDirty &&
      !window.confirm("لديك تغييرات غير محفوظة. هل تريد إلغاءها؟")
    )
      return;
    setEditing(false);
    setCardDirty(false);
    markDirty(false);
  };
  const saveCard = async () => {
    if (
      !draft.displayName?.trim() ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug || "")
    ) {
      toast.error("أدخل اسم البطاقة وSlug صحيحًا.");
      return;
    }
    const payload = {
      name: draft.name || draft.slug,
      displayName: draft.displayName.trim(),
      slug: draft.slug,
      description: draft.description || null,
      imageUrl: draft.imageUrl || null,
      backgroundUrl: draft.backgroundUrl || null,
      status: (draft.status || "COMING_SOON") as keyof typeof statuses,
      sortOrder: Number(draft.sortOrder) || 0,
      currency: draft.currency || "USD",
      regionCode: draft.regionCode || "US",
      regionLabel: draft.regionLabel || "ريجن أمريكي",
    };
    const patch = Object.fromEntries(
      Object.entries(payload).filter(
        ([key, value]) =>
          value !== (current as unknown as Record<string, unknown>)?.[key]
      )
    ) as Partial<typeof payload>;
    try {
      const result =
        selected === "new"
          ? await create.mutateAsync(payload)
          : await update.mutateAsync({ id: Number(selected), ...patch });
      setCardDirty(false);
      markDirty(false);
      setEditing(false);
      await done();
      if (selected === "new" && "id" in result)
        onNavigate("/admin/gift-cards/" + result.id);
    } catch (e) {
      fail(e);
    }
  };
  const openDenom = (id: number | "new") => {
    if (
      cardDirty &&
      !window.confirm("لديك تغييرات غير محفوظة. هل تريد إلغاءها؟")
    )
      return;
    const row = current?.denominations.find(d => d.id === id);
    setEditing(false);
    setCardDirty(false);
    setDenom(
      row
        ? Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, String(v ?? "")])
          )
        : {
            faceValue: "",
            currency: current?.currency || "USD",
            manualSellingPriceLyd: "",
            specialPriceUsd: "",
            isActive: "true",
            isAvailable: "true",
            isMostPopular: "false",
            highlightEffect: "NONE",
            sortOrder: String(current?.denominations.length || 0),
          }
    );
    setDenomId(id);
    setDenomDirty(false);
    markDirty(false);
  };
  const closeDenom = () => {
    if (
      denomDirty &&
      !window.confirm("لديك تغييرات غير محفوظة. هل تريد إلغاءها؟")
    )
      return;
    setDenomId(null);
    setDenomDirty(false);
    markDirty(false);
  };
  const changeDenom = (k: string, v: string) => {
    setDenom(d => ({ ...d, [k]: v }));
    setDenomDirty(true);
    markDirty(true);
  };
  const saveDenom = async () => {
    if (typeof selected !== "number" || !(Number(denom.faceValue) > 0)) {
      toast.error("قيمة الفئة يجب أن تكون أكبر من صفر.");
      return;
    }
    const payload = {
      giftCardId: selected,
      faceValue: Number(denom.faceValue),
      currency: denom.currency || current?.currency || "USD",
      manualSellingPriceLyd: denom.manualSellingPriceLyd
        ? Number(denom.manualSellingPriceLyd)
        : null,
      specialPriceUsd: denom.specialPriceUsd
        ? Number(denom.specialPriceUsd)
        : null,
      isActive: denom.isActive === "true",
      isAvailable: denom.isAvailable === "true",
      isMostPopular: denom.isMostPopular === "true",
      highlightEffect: denom.highlightEffect as "NONE" | "FLAME",
      sortOrder: Number(denom.sortOrder) || 0,
    };
    try {
      if (denomId === "new") await denomCreate.mutateAsync(payload);
      else await denomUpdate.mutateAsync({ id: Number(denomId), ...payload });
      setDenomId(null);
      setDenomDirty(false);
      markDirty(false);
      await done();
    } catch (e) {
      fail(e);
    }
  };
  if (cards.isLoading)
    return (
      <div className="flex items-center gap-2 p-8">
        <Loader2 className="animate-spin" />
        جارٍ تحميل البطاقات…
      </div>
    );
  if (cards.isError)
    return (
      <div role="alert">
        تعذر تحميل البطاقات.{" "}
        <button onClick={() => cards.refetch()}>إعادة المحاولة</button>
      </div>
    );
  if (selected === null)
    return (
      <section className="space-y-5" data-testid="admin-gift-grid">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Gift Cards</h2>
            <p className="mt-1 text-sm text-slate-500">
              اختر بطاقة لإدارة بياناتها وفئاتها.
            </p>
          </div>
          <button
            className={`${buttonClass} bg-blue-700 text-white`}
            onClick={() => onNavigate("/admin/gift-cards/new")}
          >
            <Plus size={17} />
            إضافة بطاقة
          </button>
        </div>
        <input
          aria-label="بحث عن بطاقة"
          className={inputClass}
          placeholder="ابحث عن بطاقة…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.data
            ?.filter(c =>
              c.displayName.toLowerCase().includes(search.toLowerCase())
            )
            .map(card => {
              const images = getGiftCardImages(card.slug);
              return (
                <button
                  key={card.id}
                  onClick={() => onNavigate("/admin/gift-cards/" + card.id)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-right shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                    <GiftCardImage
                      src={card.imageUrl}
                      centralFallbackSrc={images.cardImage}
                      fallbackSrc={images.localFallback}
                      alt={card.displayName}
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black">{card.displayName}</h3>
                      <Pencil size={17} className="shrink-0 text-blue-700" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`rounded-full px-3 py-1 font-bold ${card.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {statuses[card.status]}
                      </span>
                      <span className="text-slate-500">
                        {card.denominations.length} فئة
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </section>
    );
  if (selected !== "new" && !current)
    return (
      <div>
        البطاقة غير موجودة.{" "}
        <button onClick={() => onNavigate("/admin/gift-cards")}>
          العودة للبطاقات
        </button>
      </div>
    );
  const editForm = editing || selected === "new";
  return (
    <div className="space-y-6" data-testid="admin-gift-detail">
      <button
        className={`${buttonClass} bg-white text-blue-800`}
        onClick={() => onNavigate("/admin/gift-cards")}
      >
        <ArrowRight size={18} />
        Gift Cards
      </button>
      {current && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[240px_1fr]">
            <div className="min-h-44 bg-slate-100">
              <GiftCardImage
                src={current.imageUrl}
                centralFallbackSrc={getGiftCardImages(current.slug).cardImage}
                fallbackSrc={getGiftCardImages(current.slug).localFallback}
                alt={current.displayName}
              />
            </div>
            <div className="space-y-3 p-6">
              <span className="text-xs font-bold text-blue-700">
                Gift Cards / {current.displayName}
              </span>
              <h2 className="text-2xl font-black">{current.displayName}</h2>
              <p className="text-sm leading-7 text-slate-500">
                {current.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  {statuses[current.status]}
                </span>
                <button
                  className={`${buttonClass} bg-blue-50 text-blue-800`}
                  onClick={openCardEditor}
                >
                  <Pencil size={16} />
                  تعديل بيانات البطاقة
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      {editForm && (
        <section className="space-y-5 rounded-2xl border bg-white p-5">
          <h3 className="text-lg font-black">
            {selected === "new" ? "إضافة بطاقة" : "بيانات البطاقة"}
          </h3>
          {selected === "new" && !editing ? (
            <button
              className={`${buttonClass} bg-blue-50`}
              onClick={openCardEditor}
            >
              بدء إضافة البطاقة
            </button>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="الاسم الظاهر"
                  value={draft.displayName || ""}
                  onChange={v => change("displayName", v)}
                />
                <TextField
                  label="الرابط المختصر (Slug)"
                  value={draft.slug || ""}
                  onChange={v => change("slug", v)}
                />
                <TextField
                  label="الوصف"
                  value={draft.description || ""}
                  onChange={v => change("description", v)}
                  multiline
                />
                <TextField
                  label="الترتيب"
                  type="number"
                  value={draft.sortOrder || "0"}
                  onChange={v => change("sortOrder", v)}
                />
                <label className="text-sm font-bold">
                  الحالة
                  <select
                    className={`${inputClass} mt-2`}
                    value={draft.status || "COMING_SOON"}
                    onChange={e => change("status", e.target.value)}
                  >
                    {Object.entries(statuses).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <small className="mt-2 block font-normal text-slate-500">
                    الحالة «مخفي» تخفي البطاقة من الموقع وتبقيها في الإدارة.
                  </small>
                </label>
                <TextField
                  label="المنطقة"
                  value={draft.regionLabel || ""}
                  onChange={v => change("regionLabel", v)}
                />
                <ImageField
                  label="صورة البطاقة"
                  value={draft.imageUrl || ""}
                  onChange={v => change("imageUrl", v)}
                  onValidity={setImageValid}
                />
                <ImageField
                  label="خلفية البطاقة"
                  value={draft.backgroundUrl || ""}
                  onChange={v => change("backgroundUrl", v)}
                  onValidity={setBackgroundValid}
                />
              </div>
              <div className="flex gap-3">
                <SaveButton
                  onClick={saveCard}
                  busy={create.isPending || update.isPending}
                  disabled={!imageValid || !backgroundValid}
                />
                <button
                  className={`${buttonClass} bg-slate-100`}
                  onClick={closeEditor}
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {current && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">فئات {current.displayName}</h3>
              <p className="mt-1 text-sm text-slate-500">
                اضغط على الفئة لتعديلها. السعر الداخلي لا يظهر في الموقع.
              </p>
            </div>
            <button
              className={`${buttonClass} bg-blue-700 text-white`}
              onClick={() => openDenom("new")}
            >
              <Plus size={17} />
              إضافة فئة
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {current.denominations.map(row => (
              <button
                key={row.id}
                onClick={() => openDenom(row.id)}
                className={`relative min-h-32 overflow-hidden rounded-xl border bg-white p-4 text-center shadow-sm hover:border-blue-500 ${!row.isActive ? "border-dashed opacity-60" : row.highlightEffect === "FLAME" ? "gift-card-flame border-orange-300" : "border-slate-200"}`}
                aria-label={`تعديل فئة ${formatFaceValue(row.faceValue, row.currency)}`}
              >
                {row.highlightEffect === "FLAME" && (
                  <Flame
                    size={16}
                    className="absolute left-2 top-2 text-orange-500"
                  />
                )}
                {row.isMostPopular && (
                  <span className="block text-[10px] font-bold text-blue-700">
                    الأكثر طلبًا
                  </span>
                )}
                <span className="block text-2xl font-black">
                  {formatFaceValue(row.faceValue, row.currency)}
                </span>
                <span className="mt-2 block text-xs text-slate-500">
                  {!row.isActive
                    ? "غير فعالة — مخفية"
                    : row.isAvailable
                      ? "متوفرة"
                      : "غير متوفرة"}
                </span>
                <Pencil
                  size={13}
                  className="absolute bottom-2 left-2 text-blue-700"
                />
              </button>
            ))}
          </div>
          {!current.denominations.length && (
            <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
              لا توجد فئات بعد. أضف الفئة الأولى.
            </p>
          )}
        </section>
      )}
      <Dialog
        open={denomId !== null}
        onOpenChange={open => {
          if (!open) closeDenom();
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        >
          <DialogHeader className="text-right sm:text-right pr-6">
            <DialogTitle>
              {denomId === "new" ? "إضافة فئة" : "تعديل الفئة"} —{" "}
              {current?.displayName}
            </DialogTitle>
            <DialogDescription>
              الأسعار داخلية للإدارة. الفئة غير الفعالة تبقى محفوظة ولا تظهر
              للزوار.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="قيمة الفئة"
              type="number"
              value={denom.faceValue || ""}
              onChange={v => changeDenom("faceValue", v)}
            />
            <TextField
              label="الترتيب"
              type="number"
              value={denom.sortOrder || "0"}
              onChange={v => changeDenom("sortOrder", v)}
            />
            <TextField
              label="السعر الداخلي بالدينار (اختياري)"
              type="number"
              value={denom.manualSellingPriceLyd || ""}
              onChange={v => changeDenom("manualSellingPriceLyd", v)}
            />
            {current?.slug === "shein" && (
              <TextField
                label="سعر العرض الداخلي بالدولار"
                type="number"
                value={denom.specialPriceUsd || ""}
                onChange={v => changeDenom("specialPriceUsd", v)}
              />
            )}
            <Toggle
              label="فعالة — تظهر في الموقع"
              checked={denom.isActive === "true"}
              onChange={v => changeDenom("isActive", String(v))}
            />
            <Toggle
              label="متوفرة للشراء"
              checked={denom.isAvailable === "true"}
              onChange={v => changeDenom("isAvailable", String(v))}
            />
            <Toggle
              label="Most Popular — الأكثر طلبًا"
              checked={denom.isMostPopular === "true"}
              onChange={v => changeDenom("isMostPopular", String(v))}
            />
            <Toggle
              label="Flame Effect"
              checked={denom.highlightEffect === "FLAME"}
              onChange={v =>
                changeDenom("highlightEffect", v ? "FLAME" : "NONE")
              }
            />
          </div>
          <DialogFooter className="mt-3 gap-3">
            <SaveButton
              onClick={saveDenom}
              busy={denomCreate.isPending || denomUpdate.isPending}
            />
            <button
              className={`${buttonClass} bg-slate-100`}
              onClick={closeDenom}
            >
              إلغاء
            </button>
            {typeof denomId === "number" && (
              <button
                disabled={denomDelete.isPending}
                className={`${buttonClass} bg-red-50 text-red-700`}
                onClick={async () => {
                  if (
                    !window.confirm(
                      `حذف فئة ${formatFaceValue(denom.faceValue, denom.currency)} نهائيًا؟ لا يمكن التراجع عن الحذف.`
                    )
                  )
                    return;
                  try {
                    await denomDelete.mutateAsync({ id: denomId });
                    setDenomId(null);
                    setDenomDirty(false);
                    markDirty(false);
                    await done();
                  } catch (e) {
                    fail(e);
                  }
                }}
              >
                <Trash2 size={16} />
                حذف الفئة
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {current && (
        <button
          disabled={remove.isPending}
          className="text-sm text-red-600 underline"
          onClick={async () => {
            if (
              !window.confirm(
                `حذف ${current.displayName} وجميع فئاتها نهائيًا؟`
              )
            )
              return;
            try {
              await remove.mutateAsync({ id: current.id });
              markDirty(false);
              await done();
              onNavigate("/admin/gift-cards");
            } catch (e) {
              fail(e);
            }
          }}
        >
          حذف البطاقة
        </button>
      )}
    </div>
  );
}
