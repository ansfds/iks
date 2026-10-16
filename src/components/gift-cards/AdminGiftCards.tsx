import { useMemo, useState } from "react";
import {
  Edit,
  Flame,
  Image as ImageIcon,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { GiftCardImage } from "@/components/gift-cards/GiftCardImage";
import { getGiftCardImages } from "@/config/gift-card-images";
import {
  formatFaceValue,
  giftCardHighlightLabels,
  giftCardStatusLabels,
} from "@/lib/giftCards";
import { trpc } from "@/providers/trpc";

type GiftCardStatus = keyof typeof giftCardStatusLabels;
type HighlightEffect = keyof typeof giftCardHighlightLabels;

type GiftCardFormState = {
  name: string;
  displayName: string;
  slug: string;
  description: string;
  regionCode: string;
  regionLabel: string;
  currency: string;
  imageUrl: string;
  backgroundUrl: string;
  status: GiftCardStatus;
  sortOrder: string;
};

type DenominationFormState = {
  faceValue: string;
  currency: string;
  manualSellingPriceLyd: string;
  specialPriceUsd: string;
  isAvailable: boolean;
  isMostPopular: boolean;
  highlightEffect: HighlightEffect;
  sortOrder: string;
};

const emptyGiftCardForm: GiftCardFormState = {
  name: "",
  displayName: "",
  slug: "",
  description: "",
  regionCode: "US",
  regionLabel: "ريجن أمريكي",
  currency: "USD",
  imageUrl: "",
  backgroundUrl: "",
  status: "COMING_SOON",
  sortOrder: "0",
};

const emptyDenominationForm: DenominationFormState = {
  faceValue: "",
  currency: "USD",
  manualSellingPriceLyd: "",
  specialPriceUsd: "",
  isAvailable: true,
  isMostPopular: false,
  highlightEffect: "NONE",
  sortOrder: "0",
};

const inputClass =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-xs font-black text-slate-500";

function toSortOrder(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function AdminGiftCards() {
  const utils = trpc.useUtils();
  const listQuery = trpc.giftCards.admin.list.useQuery();
  const settingsQuery = trpc.giftCards.admin.settings.get.useQuery();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [giftCardForm, setGiftCardForm] =
    useState<GiftCardFormState>(emptyGiftCardForm);
  const [denominationForm, setDenominationForm] =
    useState<DenominationFormState>(emptyDenominationForm);
  const [editingDenominationId, setEditingDenominationId] = useState<
    number | null
  >(null);
  const [settingsDraft, setSettingsDraft] = useState<
    Partial<{
      whatsappNumber: string;
      homeGiftCardsBackgroundUrl: string;
      homeServicesBackgroundUrl: string;
      rate10To100: string;
      rateAbove100: string;
    }>
  >({});

  const detailQuery = trpc.giftCards.admin.getById.useQuery(
    { id: selectedCardId ?? 0 },
    { enabled: selectedCardId !== null },
  );

  const createCard = trpc.giftCards.admin.create.useMutation({
    onSuccess: async (result) => {
      toast.success("تمت إضافة Gift Card");
      setSelectedCardId(result.id);
      await utils.giftCards.admin.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateCard = trpc.giftCards.admin.update.useMutation({
    onSuccess: async () => {
      toast.success("تم حفظ Gift Card");
      await Promise.all([
        utils.giftCards.admin.list.invalidate(),
        utils.giftCards.admin.getById.invalidate(),
        utils.giftCards.list.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCard = trpc.giftCards.admin.delete.useMutation({
    onSuccess: async () => {
      toast.success("تم إخفاء Gift Card");
      setSelectedCardId(null);
      setGiftCardForm(emptyGiftCardForm);
      await utils.giftCards.admin.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createDenomination =
    trpc.giftCards.admin.denominations.create.useMutation({
      onSuccess: async () => {
        toast.success("تمت إضافة الفئة");
        setDenominationForm(emptyDenominationForm);
        await Promise.all([
          utils.giftCards.admin.getById.invalidate(),
          utils.giftCards.admin.list.invalidate(),
          utils.giftCards.list.invalidate(),
        ]);
      },
      onError: (error) => toast.error(error.message),
    });

  const updateDenomination =
    trpc.giftCards.admin.denominations.update.useMutation({
      onSuccess: async () => {
        toast.success("تم تعديل الفئة");
        setEditingDenominationId(null);
        setDenominationForm(emptyDenominationForm);
        await Promise.all([
          utils.giftCards.admin.getById.invalidate(),
          utils.giftCards.admin.list.invalidate(),
          utils.giftCards.list.invalidate(),
        ]);
      },
      onError: (error) => toast.error(error.message),
    });

  const deleteDenomination =
    trpc.giftCards.admin.denominations.delete.useMutation({
      onSuccess: async () => {
        toast.success("تم حذف الفئة");
        await Promise.all([
          utils.giftCards.admin.getById.invalidate(),
          utils.giftCards.admin.list.invalidate(),
          utils.giftCards.list.invalidate(),
        ]);
      },
      onError: (error) => toast.error(error.message),
    });

  const updateSettings = trpc.giftCards.admin.settings.update.useMutation({
    onSuccess: async () => {
      toast.success("تم حفظ إعدادات Gift Cards");
      await Promise.all([
        utils.giftCards.admin.settings.get.invalidate(),
        utils.giftCards.settings.invalidate(),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const selectedDetail = detailQuery.data;
  const selectedCard = selectedDetail?.card ?? null;
  const denominations = selectedDetail?.denominations ?? [];
  const cards = listQuery.data ?? [];
  const settingsForm = {
    whatsappNumber:
      settingsDraft.whatsappNumber ??
      settingsQuery.data?.whatsappNumber ??
      "218935095091",
    homeGiftCardsBackgroundUrl:
      settingsDraft.homeGiftCardsBackgroundUrl ??
      settingsQuery.data?.homeGiftCardsBackgroundUrl ??
      "",
    homeServicesBackgroundUrl:
      settingsDraft.homeServicesBackgroundUrl ??
      settingsQuery.data?.homeServicesBackgroundUrl ??
      "",
    rate10To100:
      settingsDraft.rate10To100 ??
      String(settingsQuery.data?.rate10To100 ?? 10),
    rateAbove100:
      settingsDraft.rateAbove100 ??
      String(settingsQuery.data?.rateAbove100 ?? 9.7),
  };

  const selectedCardTitle = useMemo(() => {
    if (!selectedCardId) return "إضافة Gift Card";
    return selectedCard?.displayName ?? "تعديل Gift Card";
  }, [selectedCard, selectedCardId]);

  const handleNewCard = () => {
    setSelectedCardId(null);
    setGiftCardForm(emptyGiftCardForm);
    setEditingDenominationId(null);
    setDenominationForm(emptyDenominationForm);
  };

  const handleSelectCard = (card: (typeof cards)[number]) => {
    setSelectedCardId(card.id);
    setGiftCardForm({
      name: card.name,
      displayName: card.displayName,
      slug: card.slug,
      description: card.description ?? "",
      regionCode: card.regionCode,
      regionLabel: card.regionLabel,
      currency: card.currency,
      imageUrl: card.imageUrl ?? "",
      backgroundUrl: card.backgroundUrl ?? "",
      status: card.status,
      sortOrder: String(card.sortOrder ?? 0),
    });
    setEditingDenominationId(null);
    setDenominationForm(emptyDenominationForm);
  };

  const handleSaveCard = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: giftCardForm.name,
      displayName: giftCardForm.displayName,
      slug: giftCardForm.slug,
      description: toNullableString(giftCardForm.description),
      regionCode: giftCardForm.regionCode,
      regionLabel: giftCardForm.regionLabel,
      currency: giftCardForm.currency,
      imageUrl: toNullableString(giftCardForm.imageUrl),
      backgroundUrl: toNullableString(giftCardForm.backgroundUrl),
      status: giftCardForm.status,
      sortOrder: toSortOrder(giftCardForm.sortOrder),
    };

    if (selectedCardId) {
      updateCard.mutate({ id: selectedCardId, ...payload });
      return;
    }

    createCard.mutate(payload);
  };

  const handleSaveDenomination = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCardId) {
      toast.error("اختر Gift Card أولًا");
      return;
    }

    const payload = {
      giftCardId: selectedCardId,
      faceValue: denominationForm.faceValue,
      currency: denominationForm.currency,
      manualSellingPriceLyd: toNullableString(
        denominationForm.manualSellingPriceLyd,
      ),
      specialPriceUsd: toNullableString(denominationForm.specialPriceUsd),
      isAvailable: denominationForm.isAvailable,
      isMostPopular: denominationForm.isMostPopular,
      highlightEffect: denominationForm.highlightEffect,
      sortOrder: toSortOrder(denominationForm.sortOrder),
    };

    if (editingDenominationId) {
      updateDenomination.mutate({ id: editingDenominationId, ...payload });
      return;
    }

    createDenomination.mutate(payload);
  };

  const handleEditDenomination = (denomination: (typeof denominations)[number]) => {
    setEditingDenominationId(denomination.id);
    setDenominationForm({
      faceValue: String(Number(denomination.faceValue)),
      currency: denomination.currency,
      manualSellingPriceLyd: denomination.manualSellingPriceLyd
        ? String(Number(denomination.manualSellingPriceLyd))
        : "",
      specialPriceUsd: denomination.specialPriceUsd
        ? String(Number(denomination.specialPriceUsd))
        : "",
      isAvailable: denomination.isAvailable,
      isMostPopular: denomination.isMostPopular,
      highlightEffect: denomination.highlightEffect,
      sortOrder: String(denomination.sortOrder ?? 0),
    });
  };

  const handleDeleteCard = () => {
    if (!selectedCardId) return;
    const confirmed = window.confirm(
      "سيتم إخفاء Gift Card من الموقع العام. هل أنت متأكد؟",
    );
    if (confirmed) {
      deleteCard.mutate({ id: selectedCardId });
    }
  };

  const handleDeleteDenomination = (id: number) => {
    const confirmed = window.confirm("هل تريد حذف هذه الفئة؟");
    if (confirmed) {
      deleteDenomination.mutate({ id });
    }
  };

  const handleSaveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    updateSettings.mutate({
      whatsappNumber: settingsForm.whatsappNumber,
      homeGiftCardsBackgroundUrl: toNullableString(
        settingsForm.homeGiftCardsBackgroundUrl,
      ),
      homeServicesBackgroundUrl: toNullableString(
        settingsForm.homeServicesBackgroundUrl,
      ),
      rate10To100: Number(settingsForm.rate10To100),
      rateAbove100: Number(settingsForm.rateAbove100),
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                إعدادات Gift Cards
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                رقم واتس أب، الصور، وقواعد التسعير العامة.
              </p>
            </div>
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              <Save size={16} />
              حفظ الإعدادات
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <label>
              <span className={labelClass}>Gift Cards WhatsApp Number</span>
              <input
                value={settingsForm.whatsappNumber}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    whatsappNumber: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Rate $10 - $100</span>
              <input
                type="number"
                step="0.001"
                value={settingsForm.rate10To100}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    rate10To100: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Rate Above $100</span>
              <input
                type="number"
                step="0.001"
                value={settingsForm.rateAbove100}
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    rateAbove100: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Gift Card Background Image URL</span>
              <input
                value={settingsForm.homeGiftCardsBackgroundUrl}
                placeholder="فارغ = استخدام الخلفية من ملف الصور"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    homeGiftCardsBackgroundUrl: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Services Background Image URL</span>
              <input
                value={settingsForm.homeServicesBackgroundUrl}
                placeholder="فارغ = استخدام الخلفية من ملف الصور"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    homeServicesBackgroundUrl: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Gift Card</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Gift Card | Region | Status | Denominations | Actions
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewCard}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              إضافة Gift Card
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-right text-xs font-black text-slate-500">
                    Gift Card
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black text-slate-500">
                    Region
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black text-slate-500">
                    Denominations
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-black text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      جار التحميل...
                    </td>
                  </tr>
                ) : cards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      لا توجد Gift Cards بعد.
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr
                      key={card.id}
                      className={
                        selectedCardId === card.id
                          ? "bg-blue-50/70"
                          : "hover:bg-slate-50"
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-950">
                          {card.displayName}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          /gift-cards/{card.slug}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {card.regionCode} - {card.regionLabel}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {giftCardStatusLabels[card.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-slate-700">
                        {card.denominationCount}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleSelectCard(card)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          <Edit size={15} />
                          تعديل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={handleSaveCard}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                {selectedCardTitle}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                الصور تقبل Image URL أو مسارًا محليًا داخل public.
              </p>
            </div>
            {selectedCardId && (
              <button
                type="button"
                onClick={handleDeleteCard}
                className="rounded-md p-2 text-red-600 transition hover:bg-red-50"
                title="إخفاء"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Name</span>
                <input
                  required
                  value={giftCardForm.name}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Display Name</span>
                <input
                  required
                  value={giftCardForm.displayName}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <label>
              <span className={labelClass}>Slug</span>
              <input
                required
                value={giftCardForm.slug}
                onChange={(event) =>
                  setGiftCardForm((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className={labelClass}>Region Code</span>
                <input
                  value={giftCardForm.regionCode}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      regionCode: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Region Label</span>
                <input
                  value={giftCardForm.regionLabel}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      regionLabel: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Currency</span>
                <input
                  value={giftCardForm.currency}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <label>
              <span className={labelClass}>Card Image URL</span>
              <input
                value={giftCardForm.imageUrl}
                placeholder="فارغ = استخدام صورة البطاقة من ملف الصور"
                onChange={(event) =>
                  setGiftCardForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Background Image URL</span>
              <input
                value={giftCardForm.backgroundUrl}
                placeholder="فارغ = استخدام خلفية البطاقة من ملف الصور"
                onChange={(event) =>
                  setGiftCardForm((current) => ({
                    ...current,
                    backgroundUrl: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClass}>Status</span>
                <select
                  value={giftCardForm.status}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      status: event.target.value as GiftCardStatus,
                    }))
                  }
                  className={inputClass}
                >
                  {Object.entries(giftCardStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Sort Order</span>
                <input
                  type="number"
                  value={giftCardForm.sortOrder}
                  onChange={(event) =>
                    setGiftCardForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <label>
              <span className={labelClass}>Description</span>
              <textarea
                value={giftCardForm.description}
                onChange={(event) =>
                  setGiftCardForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 w-full rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-xs font-black text-slate-500">
                  <ImageIcon size={14} />
                  Card Preview
                </div>
                <div className="aspect-[16/10]">
                  <GiftCardImage
                    src={giftCardForm.imageUrl}
                    centralFallbackSrc={getGiftCardImages(giftCardForm.slug).cardImage}
                    fallbackSrc={getGiftCardImages(giftCardForm.slug).localFallback}
                    alt="معاينة صورة البطاقة"
                    title={giftCardForm.displayName || "Gift Card"}
                    fallbackText="تعذر تحميل الصورة"
                  />
                </div>
              </div>
              <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-xs font-black text-slate-500">
                  <ImageIcon size={14} />
                  Background Preview
                </div>
                <div className="aspect-[16/10]">
                  <GiftCardImage
                    src={giftCardForm.backgroundUrl}
                    centralFallbackSrc={getGiftCardImages(giftCardForm.slug).backgroundImage}
                    fallbackSrc={getGiftCardImages(giftCardForm.slug).localFallback}
                    alt="معاينة الخلفية"
                    title={giftCardForm.displayName || "Background"}
                    fallbackText="تعذر تحميل الصورة"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createCard.isPending || updateCard.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              <Save size={16} />
              حفظ Gift Card
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              الفئات السعرية
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              السعر اليدوي اختياري، وإذا تُرك فارغًا يتم حساب السعر من قواعد التسعير أو Special USD.
            </p>
          </div>
          {editingDenominationId && (
            <button
              type="button"
              onClick={() => {
                setEditingDenominationId(null);
                setDenominationForm(emptyDenominationForm);
              }}
              className="text-sm font-black text-slate-500 hover:text-slate-900"
            >
              إلغاء تعديل الفئة
            </button>
          )}
        </div>

        {!selectedCardId ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
            اختر Gift Card أو أضف واحدًا جديدًا قبل إدارة الفئات.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <form onSubmit={handleSaveDenomination} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label>
                  <span className={labelClass}>face_value</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={denominationForm.faceValue}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        faceValue: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>currency</span>
                  <input
                    value={denominationForm.currency}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>manual_selling_price_lyd</span>
                  <input
                    type="number"
                    step="0.001"
                    value={denominationForm.manualSellingPriceLyd}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        manualSellingPriceLyd: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>special_price_usd</span>
                  <input
                    type="number"
                    step="0.01"
                    value={denominationForm.specialPriceUsd}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        specialPriceUsd: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className={labelClass}>sort_order</span>
                  <input
                    type="number"
                    value={denominationForm.sortOrder}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center justify-between gap-3 text-sm font-black text-slate-700">
                  is_available
                  <input
                    type="checkbox"
                    checked={denominationForm.isAvailable}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        isAvailable: event.target.checked,
                      }))
                    }
                    className="h-5 w-5"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm font-black text-slate-700">
                  is_most_popular
                  <input
                    type="checkbox"
                    checked={denominationForm.isMostPopular}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        isMostPopular: event.target.checked,
                      }))
                    }
                    className="h-5 w-5"
                  />
                </label>
                <label>
                  <span className={labelClass}>highlight_effect</span>
                  <select
                    value={denominationForm.highlightEffect}
                    onChange={(event) =>
                      setDenominationForm((current) => ({
                        ...current,
                        highlightEffect: event.target.value as HighlightEffect,
                      }))
                    }
                    className={inputClass}
                  >
                    {Object.entries(giftCardHighlightLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={createDenomination.isPending || updateDenomination.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
              >
                <Plus size={16} />
                {editingDenominationId ? "حفظ تعديل الفئة" : "إضافة فئة"}
              </button>
            </form>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      الفئة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      السعر النهائي
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      Manual LYD
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      Special USD
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      Badge
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      Flame
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailQuery.isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        جار تحميل الفئات...
                      </td>
                    </tr>
                  ) : denominations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        لا توجد فئات بعد.
                      </td>
                    </tr>
                  ) : (
                    denominations.map((denomination) => (
                      <tr key={denomination.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-black text-slate-950">
                          {formatFaceValue(
                            denomination.faceValue,
                            denomination.currency,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {denomination.sellingPriceLyd
                            ? Number(denomination.sellingPriceLyd).toLocaleString(
                                "ar-LY",
                              )
                            : "غير محدد"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {denomination.manualSellingPriceLyd
                            ? Number(
                                denomination.manualSellingPriceLyd,
                              ).toLocaleString("ar-LY")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {denomination.specialPriceUsd
                            ? `$${Number(denomination.specialPriceUsd).toLocaleString(
                                "en-US",
                              )}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {denomination.isAvailable ? (
                            <span className="text-emerald-700">متوفر</span>
                          ) : (
                            <span className="text-red-600">غير متوفر</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-700">
                          {denomination.isMostPopular ? "الأكثر طلبًا" : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {denomination.highlightEffect === "FLAME" ? (
                            <Flame className="h-5 w-5 text-orange-500" />
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditDenomination(denomination)}
                              className="rounded-md border border-slate-200 p-2 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                              title="تعديل"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteDenomination(denomination.id)
                              }
                              className="rounded-md border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
