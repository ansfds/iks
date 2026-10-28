import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useSiteContent, type SitePhone, type SiteHour } from "@/hooks/useSiteContent";
import { toast } from "sonner";
import { CmsDeploymentBanner } from '@/components/CmsDeploymentBanner';
import {
  LayoutDashboard, Landmark, Gift, Contact, Image as ImageIcon, FileText,
  Search, Settings, ShieldCheck, Plus, Trash2, Save, ExternalLink, LogOut,
  PanelRightClose, Layers, History, Globe, Pencil, Loader2, ArrowUp, ArrowDown,
} from "lucide-react";

type Section = "dashboard" | "banks" | "gifts" | "services" | "contact" | "images" | "content" | "seo" | "settings" | "sections" | "audit";
type Fields = Record<string, string>;
const labels: Record<Section, string> = {
  dashboard: "الرئيسية", banks: "الحسابات المصرفية", gifts: "Gift Cards", services: "الخدمات",
  contact: "التواصل", images: "الصور", content: "الصفحة الرئيسية والنصوص", seo: "SEO",
  settings: "إعدادات الموقع", sections: "إظهار الأقسام", audit: "سجل التعديلات",
};
const icons: Record<Section, typeof Gift> = {
  dashboard: LayoutDashboard, banks: Landmark, gifts: Gift, services: Layers,
  contact: Contact, images: ImageIcon, content: FileText, seo: Search,
  settings: Settings, sections: PanelRightClose, audit: History,
};
const navigation: Section[] = ["dashboard", "banks", "gifts", "services", "contact", "images", "content", "sections", "seo", "settings", "audit"];
const statusNames = { AVAILABLE: "متوفر", COMING_SOON: "قريبًا", UNAVAILABLE: "غير متوفر", HIDDEN: "مخفي" };
const normalInput = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const button = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50";

function TextField({ label, value, onChange, multiline, inputType = "text", hint }: { label: string; value: string; onChange: (next: string) => void; multiline?: boolean; inputType?: string; hint?: string }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-sm font-bold text-slate-700">{label}</span>
    {multiline ? <textarea className={normalInput} rows={3} value={value} onChange={e => onChange(e.target.value)} /> :
      <input className={normalInput} type={inputType} value={value} onChange={e => onChange(e.target.value)} />}
    {hint && <small className="mt-1 block text-slate-500">{hint}</small>}
  </label>;
}
function ImageField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [failed, setFailed] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const upload = trpc.cms.uploadImage.useMutation();
  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast.error('اختر صورة PNG أو JPEG أو WebP بحجم أقصاه 2 MB.'); return; }
    try {
      const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
      const result = await upload.mutateAsync({ mime: file.type as 'image/png' | 'image/jpeg' | 'image/webp', base64 });
      onChange(result.url); setUploadPreview(`data:${file.type};base64,${base64}`); setFailed(false); toast.success('تم حفظ الصورة. احفظ الحقل لعرضها في الصفحة بعد النشر.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'تعذر حفظ الصورة.'); }
  };
  return <div><TextField label={label} value={value} onChange={next => { setFailed(false); setUploadPreview(null); onChange(next); }} inputType="url" />
    <label className="mt-2 block text-sm">{upload.isPending ? 'جارٍ حفظ الصورة…' : 'رفع صورة دائمة'}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={upload.isPending} className="mt-1 block w-full text-xs" onChange={event => { void uploadFile(event.target.files?.[0]); event.target.value = ''; }} /></label>
    {value && !failed && <img src={uploadPreview || value} alt="معاينة" onError={() => setFailed(true)} className="mt-3 max-h-44 w-full rounded-xl bg-slate-50 object-contain" />}
    {failed && <p className="mt-2 text-sm text-red-600">تعذر تحميل الصورة. تأكد من الرابط قبل الحفظ.</p>}
  </div>;
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700">
    <input className="h-4 w-4 accent-blue-700" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><h2 className="text-lg font-black text-slate-900">{title}</h2>{action}</div>{children}</section>;
}
function Notice({ children }: { children: React.ReactNode }) { return <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm leading-7 text-blue-900">{children}</p>; }
function ConfirmButton({ onClick, label = "حذف", busy }: { onClick: () => void; label?: string; busy?: boolean }) {
  return <button type="button" disabled={busy} className={`${button} bg-red-50 text-red-700 hover:bg-red-100`} onClick={() => { if (window.confirm(`هل أنت متأكد من ${label}؟`)) onClick(); }}><Trash2 size={15}/>{label}</button>;
}
function SaveButton({ busy, label = "حفظ التعديلات", onClick }: { busy: boolean; label?: string; onClick: () => void }) {
  return <button type="button" className={`${button} bg-[#213B6F] text-white hover:bg-[#2C4F8E]`} onClick={onClick} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {label}</button>;
}
function useAdminMutations() {
  const utils = trpc.useUtils();
  const done = async (message = "تم الحفظ بنجاح") => {
    await Promise.all([utils.finance.invalidate(), utils.giftCards.invalidate(), utils.siteContent.invalidate()]);
    toast.success(message);
  };
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "تعذر حفظ التعديلات");
  return { done, fail };
}

const bankFields: Array<[string, string]> = [
  ["bankNameAr", "اسم المصرف"], ["accountName", "صاحب الحساب"], ["accountNumber", "رقم الحساب"],
  ["iban", "IBAN"], ["bankLogoUrl", "رابط شعار المصرف"], ["notesAr", "ملاحظات"],
  ["slug", "الاسم المختصر للرابط (إنجليزي)"], ["sortOrder", "ترتيب العرض"],
];
function BankManager({ markDirty }: { markDirty: (dirty: boolean) => void }) {
  const { done, fail } = useAdminMutations();
  const banks = trpc.finance.admin.bankAccounts.list.useQuery({ page: 1, limit: 100 });
  const countries = trpc.finance.admin.countries.list.useQuery({ page: 1, limit: 100 });
  const currencies = trpc.finance.admin.currencies.list.useQuery({ page: 1, limit: 100 });
  const create = trpc.finance.admin.bankAccounts.create.useMutation();
  const update = trpc.finance.admin.bankAccounts.update.useMutation();
  const remove = trpc.finance.admin.bankAccounts.delete.useMutation();
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Fields>({});
  const [search, setSearch] = useState("");
  const open = (id: number | "new") => {
    const row = banks.data?.items.find(x => x.id === id);
    setEditing(id);
    setDraft(row ? { ...Object.fromEntries(Object.entries(row).map(([k,v]) => [k, String(v ?? "")])), isActive: String(row.isActive) } : {
      bankNameAr: "", accountName: "", accountNumber: "", iban: "", bankLogoUrl: "", notesAr: "",
      slug: "", sortOrder: String((banks.data?.total ?? 0) + 1), isActive: "true",
      countryId: String(countries.data?.items[0]?.id ?? 1), currencyId: String(currencies.data?.items[0]?.id ?? 1),
    }); markDirty(false);
  };
  const change = (key: string, val: string) => { setDraft(d => ({ ...d, [key]: val })); markDirty(true); };
  const save = async () => {
    const bankNameAr = draft.bankNameAr?.trim(), accountName = draft.accountName?.trim(), accountNumber = draft.accountNumber?.trim(), slug = draft.slug?.trim();
    if (!bankNameAr || !accountName || !accountNumber || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { toast.error("أدخل اسم المصرف وصاحب الحساب ورقم الحساب وSlug صحيح."); return; }
    if (draft.bankLogoUrl && !/^(https:\/\/|\/)/.test(draft.bankLogoUrl)) { toast.error("رابط صورة غير صالح"); return; }
    const payload = { bankNameAr, accountName, accountNumber, slug, iban: draft.iban || null,
      bankLogoUrl: draft.bankLogoUrl || null, notesAr: draft.notesAr || null,
      isActive: draft.isActive === "true", sortOrder: Number(draft.sortOrder) || 0,
      countryId: Number(draft.countryId), currencyId: Number(draft.currencyId) };
    try {
      if (editing === "new") await create.mutateAsync(payload);
      else if (typeof editing === "number") await update.mutateAsync({ id: editing, ...payload });
      await done(); setEditing(null); markDirty(false);
    } catch (e) { fail(e); }
  };
  const sorted = banks.data?.items.filter(x => `${x.bankNameAr} ${x.accountName} ${x.iban ?? ""}`.includes(search)) ?? [];
  return <div className="space-y-5"><SectionCard title="الحسابات المصرفية" action={<button className={`${button} bg-blue-50 text-blue-800`} onClick={() => open("new")}><Plus size={16}/> إضافة حساب</button>}>
    <div className="mb-4"><input className={normalInput} placeholder="بحث عن مصرف أو صاحب حساب..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {banks.isLoading ? <Loader2 className="animate-spin"/> : banks.isError ? <Notice>تعذر تحميل الحسابات. <button onClick={()=>banks.refetch()}>إعادة المحاولة</button></Notice> :
      <div className="space-y-3">{sorted.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
        <div><b className="text-slate-900">{row.bankNameAr}</b><p className="mt-1 text-sm text-slate-600">{row.accountName} · {row.iban || row.accountNumber}</p><small className="text-slate-400">#{row.sortOrder} · {row.isActive ? "ظاهر" : "مخفي"}</small></div>
        <div className="flex gap-2"><button className={`${button} bg-slate-100 text-slate-800`} onClick={()=>open(row.id)}><Pencil size={15}/>تعديل</button>
          <ConfirmButton busy={remove.isPending} onClick={async()=>{try{await remove.mutateAsync({id:row.id});await done("تم حذف الحساب")}catch(e){fail(e)}}}/></div>
      </div>)}{!sorted.length && <p className="text-sm text-slate-500">لا توجد حسابات مطابقة.</p>}</div>}
  </SectionCard>
  {editing !== null && <SectionCard title={editing === "new" ? "إضافة حساب جديد" : "تعديل بيانات الحساب"} action={<button className={`${button} bg-slate-100`} onClick={()=>{setEditing(null);markDirty(false)}}>إلغاء</button>}>
    <div className="grid gap-4 md:grid-cols-2">{bankFields.map(([key,label]) => key === "bankLogoUrl" ? <ImageField key={key} label={label} value={draft[key] ?? ""} onChange={v=>change(key,v)}/> : <TextField key={key} label={label} value={draft[key] ?? ""} onChange={v=>change(key,v)} inputType={key === "sortOrder" ? "number" : "text"}/>)}
      <label className="block"><span className="mb-1.5 block text-sm font-bold">البلد</span><select className={normalInput} value={draft.countryId} onChange={e=>change("countryId",e.target.value)}>{countries.data?.items.map(x=><option key={x.id} value={x.id}>{x.nameAr}</option>)}</select></label>
      <label className="block"><span className="mb-1.5 block text-sm font-bold">العملة</span><select className={normalInput} value={draft.currencyId} onChange={e=>change("currencyId",e.target.value)}>{currencies.data?.items.map(x=><option key={x.id} value={x.id}>{x.symbol}</option>)}</select></label>
      <Toggle label="إظهار الحساب للزوار" checked={draft.isActive === "true"} onChange={v=>change("isActive",String(v))}/>
    </div><div className="mt-5"><SaveButton busy={create.isPending||update.isPending} onClick={save}/></div>
  </SectionCard>}
  <Notice>يمكن تغيير الترتيب من حقل «ترتيب العرض». الحساب المخفي يبقى محفوظًا لكنه لا يظهر للزوار.</Notice></div>;
}

const cardFields: Array<[string,string]> = [
  ["displayName", "الاسم الظاهر"], ["name", "اسم داخلي"], ["slug", "Slug"],
  ["description", "الوصف"], ["regionLabel", "اسم المنطقة"], ["regionCode", "كود المنطقة"],
  ["imageUrl", "رابط صورة البطاقة"], ["backgroundUrl", "رابط الخلفية"], ["sortOrder", "الترتيب"],
];
function GiftManager({ markDirty }: { markDirty: (dirty: boolean) => void }) {
  const { done, fail } = useAdminMutations();
  const cards = trpc.giftCards.admin.list.useQuery();
  const create = trpc.giftCards.admin.create.useMutation();
  const update = trpc.giftCards.admin.update.useMutation();
  const remove = trpc.giftCards.admin.delete.useMutation();
  const denomCreate = trpc.giftCards.admin.denominations.create.useMutation();
  const denomUpdate = trpc.giftCards.admin.denominations.update.useMutation();
  const denomDelete = trpc.giftCards.admin.denominations.delete.useMutation();
  const settings = trpc.giftCards.admin.settings.get.useQuery();
  const updateSettings = trpc.giftCards.admin.settings.update.useMutation();
  const [selected, setSelected] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Fields>({});
  const [denomId, setDenomId] = useState<number | "new" | null>(null);
  const [denom, setDenom] = useState<Fields>({});
  const [pricing, setPricing] = useState<Fields>({});
  const [search, setSearch] = useState("");
  const current = cards.data?.find(x=>x.id===selected);
  const open = (id: number | "new") => {
    const item = cards.data?.find(x=>x.id===id); setSelected(id); setDenomId(null);
    setDraft(item ? Object.fromEntries(Object.entries(item).map(([k,v])=>[k,String(v??"")])) : {
      name:"",displayName:"",slug:"",description:"",regionLabel:"ريجن أمريكي",regionCode:"US",currency:"USD",
      imageUrl:"",backgroundUrl:"",sortOrder:String((cards.data?.length??0)+1),status:"COMING_SOON"
    }); markDirty(false);
  };
  const change = (key:string,val:string) => {setDraft(x=>({...x,[key]:val}));markDirty(true)};
  const save = async () => {
    if (!draft.displayName?.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {toast.error("أدخل اسم البطاقة وSlug صحيح");return;}
    const payload = { name:draft.name||draft.slug,displayName:draft.displayName,slug:draft.slug,description:draft.description||null,
      regionCode:draft.regionCode||"US",regionLabel:draft.regionLabel||"ريجن أمريكي",currency:draft.currency||"USD",
      imageUrl:draft.imageUrl||null,backgroundUrl:draft.backgroundUrl||null,
      status:draft.status as keyof typeof statusNames,sortOrder:Number(draft.sortOrder)||0 };
    try { if(selected==="new") await create.mutateAsync(payload); else if(typeof selected==="number") await update.mutateAsync({id:selected,...payload}); await done();setSelected(null);markDirty(false); }
    catch(e){fail(e)}
  };
  const openDenom = (id: number | "new") => {
    const item = current?.denominations.find(x=>x.id===id);setDenomId(id);
    setDenom(item ? Object.fromEntries(Object.entries(item).map(([k,v])=>[k,String(v??"")])) : {faceValue:"",specialPriceUsd:"",manualSellingPriceLyd:"",isAvailable:"true",isMostPopular:"false",highlightEffect:"NONE",sortOrder:String((current?.denominations.length??0)+1)});
    markDirty(false);
  };
  const saveDenom=async()=>{
    if(typeof selected!=="number" || !(Number(denom.faceValue)>0)) {toast.error("الفئة يجب أن تكون رقمًا أكبر من صفر");return;}
    const payload={giftCardId:selected,faceValue:Number(denom.faceValue),currency:"USD",specialPriceUsd:denom.specialPriceUsd?Number(denom.specialPriceUsd):null,
      manualSellingPriceLyd:denom.manualSellingPriceLyd?Number(denom.manualSellingPriceLyd):null,
      isAvailable:denom.isAvailable==="true",isMostPopular:denom.isMostPopular==="true",highlightEffect:denom.highlightEffect as "NONE"|"FLAME",sortOrder:Number(denom.sortOrder)||0};
    try{if(denomId==="new")await denomCreate.mutateAsync(payload);else if(typeof denomId==="number")await denomUpdate.mutateAsync({id:denomId,...payload});await done();setDenomId(null);markDirty(false)}catch(e){fail(e)}
  };
  const savePricing=async()=>{
    try{await updateSettings.mutateAsync({whatsappNumber:pricing.whatsappNumber||settings.data?.whatsappNumber||"218935095091",
      rate10To100:Number(pricing.rate10To100||settings.data?.rate10To100||10),rateAbove100:Number(pricing.rateAbove100||settings.data?.rateAbove100||9.7),
      homeGiftCardsBackgroundUrl:pricing.homeGiftCardsBackgroundUrl??settings.data?.homeGiftCardsBackgroundUrl??null,
      homeServicesBackgroundUrl:pricing.homeServicesBackgroundUrl??settings.data?.homeServicesBackgroundUrl??null});await done();markDirty(false)}catch(e){fail(e)}
  };
  return <div className="space-y-5">
    <SectionCard title="إدارة Gift Cards" action={<button className={`${button} bg-blue-50 text-blue-800`} onClick={()=>open("new")}><Plus size={16}/>إضافة بطاقة</button>}>
      <input className={`${normalInput} mb-4`} placeholder="ابحث عن بطاقة..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {cards.isLoading ? <Loader2 className="animate-spin"/> : cards.isError ? <Notice>تعذر قراءة البطاقات. أعد المحاولة.</Notice> : <div className="grid gap-3 sm:grid-cols-2">{cards.data?.filter(x=>x.displayName.toLowerCase().includes(search.toLowerCase())).map(x=><div key={x.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
        <div className="flex gap-3">{x.imageUrl && <img src={x.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-contain"/>}<div><b>{x.displayName}</b><p className="text-xs text-slate-500">{statusNames[x.status]} · {x.denominationCount} فئة</p></div></div>
        <div className="flex flex-wrap gap-2"><button className={`${button} bg-slate-100 text-slate-800`} onClick={()=>open(x.id)}><Pencil size={15}/> تعديل</button>
          <ConfirmButton label="إخفاء البطاقة" onClick={async()=>{try{await remove.mutateAsync({id:x.id});await done("تم إخفاء البطاقة") }catch(e){fail(e)}}}/></div>
      </div>)}</div>}
    </SectionCard>
    {selected!==null && <SectionCard title={selected==="new" ? "بطاقة جديدة" : `تعديل ${current?.displayName??"البطاقة"}`} action={<button className={`${button} bg-slate-100`} onClick={()=>{setSelected(null);markDirty(false)}}>إغلاق</button>}>
      <div className="grid gap-4 md:grid-cols-2">{cardFields.map(([key,label])=>key.endsWith("Url") ? <ImageField key={key} label={label} value={draft[key]??""} onChange={v=>change(key,v)}/> : <TextField key={key} label={label} value={draft[key]??""} onChange={v=>change(key,v)} multiline={key==="description"} inputType={key==="sortOrder"?"number":"text"}/>)}
        <label><span className="mb-1.5 block text-sm font-bold">حالة البطاقة</span><select className={normalInput} value={draft.status} onChange={e=>change("status",e.target.value)}>{Object.entries(statusNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      </div><div className="mt-5"><SaveButton busy={create.isPending||update.isPending} onClick={save}/></div>
      {typeof selected==="number" && <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="mb-4 flex justify-between"><h3 className="text-lg font-black">الفئات والأسعار</h3><button className={`${button} bg-blue-50 text-blue-800`} onClick={()=>openDenom("new")}><Plus size={16}/>فئة جديدة</button></div>
        <div className="grid gap-2 sm:grid-cols-2">{current?.denominations.map(x=><div key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><b>${x.faceValue}</b><p className="text-xs text-slate-500">{x.specialPriceUsd?`عرض $${x.specialPriceUsd} · `:""}{x.isMostPopular?"الأكثر طلبًا · ":""}{x.highlightEffect==="FLAME"?"🔥 · ":""}{x.isAvailable?"متوفر":"غير متوفر"}</p></div><div className="flex gap-1"><button className={`${button} bg-slate-100`} onClick={()=>openDenom(x.id)}><Pencil size={15}/></button><ConfirmButton label="حذف" onClick={async()=>{try{await denomDelete.mutateAsync({id:x.id});await done("تم حذف الفئة")}catch(e){fail(e)}}}/></div></div>)}</div>
        {denomId!==null && <div className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4"><h4 className="font-bold">{denomId==="new"?"إضافة فئة":"تعديل الفئة"}</h4><div className="grid gap-3 sm:grid-cols-2">
          {([ ["faceValue","قيمة البطاقة بالدولار"],["specialPriceUsd","سعر العرض بالدولار (SHEIN)"],["manualSellingPriceLyd","سعر يدوي بالدينار (اختياري)"],["sortOrder","الترتيب"]] as const).map(([k,l])=><TextField key={k} label={l} value={denom[k]??""} inputType="number" onChange={v=>{setDenom(d=>({...d,[k]:v}));markDirty(true)}}/>)}
          <Toggle label="متوفر" checked={denom.isAvailable==="true"} onChange={v=>{setDenom(d=>({...d,isAvailable:String(v)}));markDirty(true)}}/>
          <Toggle label="الأكثر طلبًا" checked={denom.isMostPopular==="true"} onChange={v=>{setDenom(d=>({...d,isMostPopular:String(v)}));markDirty(true)}}/>
          <Toggle label="تأثير اللهب 🔥" checked={denom.highlightEffect==="FLAME"} onChange={v=>{setDenom(d=>({...d,highlightEffect:v?"FLAME":"NONE"}));markDirty(true)}}/>
          </div><div className="flex gap-2"><SaveButton busy={denomCreate.isPending||denomUpdate.isPending} onClick={saveDenom}/><button className={`${button} bg-slate-200`} onClick={()=>{setDenomId(null);markDirty(false)}}>إلغاء</button></div></div>}
      </div>}
    </SectionCard>}
    <SectionCard title="إعدادات البطاقات العامة"><Notice>تبقى عملية الطلب عبر واتساب كما هي، ويُؤكد السعر النهائي عند الشراء.</Notice>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{([ ["whatsappNumber","رقم واتساب Gift Cards"],["rate10To100","سعر الصرف للفئات حتى 100$"],["rateAbove100","سعر الصرف للفئات الأكبر من 100$"] ] as const).map(([k,l])=><TextField key={k} label={l} value={pricing[k]??String(settings.data?.[k]??"")} onChange={v=>{setPricing(d=>({...d,[k]:v}));markDirty(true)}}/>)}
        {([ ["homeGiftCardsBackgroundUrl","خلفية البطاقات في الصفحة الرئيسية"], ["homeServicesBackgroundUrl","خلفية الخدمات في الصفحة الرئيسية"] ] as const).map(([k,l])=><ImageField key={k} label={l} value={pricing[k]??settings.data?.[k]??""} onChange={v=>{setPricing(d=>({...d,[k]:v}));markDirty(true)}}/>)}
      </div><div className="mt-4"><SaveButton busy={updateSettings.isPending} onClick={savePricing}/></div>
    </SectionCard>
  </div>;
}

function ServiceManager({ markDirty }: { markDirty: (dirty: boolean)=>void }) {
  const {done,fail}=useAdminMutations();
  const query=trpc.finance.admin.services.list.useQuery({page:1,limit:100});
  const create=trpc.finance.admin.services.create.useMutation();const update=trpc.finance.admin.services.update.useMutation();const remove=trpc.finance.admin.services.delete.useMutation();
  const [selected,setSelected]=useState<number|"new"|null>(null);const [draft,setDraft]=useState<Fields>({});
  const open=(id:number|"new")=>{const item=query.data?.items.find(x=>x.id===id);setSelected(id);setDraft(item?Object.fromEntries(Object.entries(item).map(([k,v])=>[k,String(v??"")])):{nameAr:"",descriptionAr:"",imageUrl:"",icon:"",href:"",sortOrder:String((query.data?.total??0)+1),isActive:"true"});markDirty(false)};
  const change=(k:string,v:string)=>{setDraft(d=>({...d,[k]:v}));markDirty(true)};
  const save=async()=>{if(!draft.nameAr?.trim()){toast.error("أدخل اسم الخدمة");return;}const payload={nameAr:draft.nameAr,descriptionAr:draft.descriptionAr||null,imageUrl:draft.imageUrl||null,icon:draft.icon||null,href:draft.href||null,isActive:draft.isActive==="true",sortOrder:Number(draft.sortOrder)||0};try{if(selected==="new")await create.mutateAsync({...payload,isCalculatorEnabled:false,calculatorRateType:"calculator"});else if(typeof selected==="number")await update.mutateAsync({id:selected,...payload});await done();setSelected(null);markDirty(false)}catch(e){fail(e)}};
  return <div className="space-y-4"><SectionCard title="الخدمات" action={<button className={`${button} bg-blue-50 text-blue-700`} onClick={()=>open("new")}><Plus size={16}/>خدمة جديدة</button>}>
    {query.data?.items.map(x=><div key={x.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3"><div><b>{x.nameAr}</b><p className="text-xs text-slate-500">{x.isActive?"ظاهر":"مخفي"} · ترتيب {x.sortOrder}</p></div><div className="flex gap-2"><button className={`${button} bg-slate-100`} onClick={()=>open(x.id)}>تعديل</button><ConfirmButton onClick={async()=>{try{await remove.mutateAsync({id:x.id});await done("حُذفت الخدمة")}catch(e){fail(e)}}}/></div></div>)}
    {query.isLoading&&<Loader2 className="animate-spin"/>}{query.isError&&<Notice>تعذر تحميل الخدمات.</Notice>}
  </SectionCard>{selected!==null&&<SectionCard title={selected==="new"?"إضافة خدمة":"تعديل الخدمة"}><div className="grid gap-3 md:grid-cols-2">
    {([ ["nameAr","اسم الخدمة"],["descriptionAr","وصف الخدمة"],["icon","الأيقونة"],["href","رابط الخدمة"],["sortOrder","الترتيب"] ] as const).map(([k,l])=><TextField key={k} label={l} value={draft[k]??""} onChange={v=>change(k,v)} multiline={k==="descriptionAr"} inputType={k==="sortOrder"?"number":"text"}/>)}
    <ImageField label="رابط الصورة" value={draft.imageUrl??""} onChange={v=>change("imageUrl",v)}/><Toggle label="إظهار الخدمة" checked={draft.isActive==="true"} onChange={v=>change("isActive",String(v))}/>
    </div><div className="mt-4 flex gap-2"><SaveButton busy={create.isPending||update.isPending} onClick={save}/><button className={`${button} bg-slate-100`} onClick={()=>{setSelected(null);markDirty(false)}}>إلغاء</button></div></SectionCard>}
  </div>;
}

type CmsCategory = "contact"|"images"|"content"|"seo"|"settings"|"sections";
const cmsFields: Record<CmsCategory, Array<[string,string]>> = {
  contact: [["site_address","عنوان المكتب"],["site_whatsapp","واتساب المكتب"],["site_facebook","رابط فيسبوك"],["site_map_url","رابط الخرائط"]],
  images: [["site_logo","شعار الموقع"],["site_favicon","أيقونة الموقع"],["hero_image","صورة Hero"],["about_image","صورة من نحن"],["services_image","صورة الخدمات"],["seo_og_image","صورة مشاركة الموقع"]],
  content: [["hero_title","عنوان Hero"],["hero_subtitle","وصف Hero"],["hero_cta","زر Hero"],["about_title","عنوان عن الوسيط المعتمد"],["about_description","النص التعريفي"],["footer_description","وصف التذييل"]],
  seo: [["seo_title","عنوان الموقع الافتراضي"],["seo_description","وصف الموقع الافتراضي"],["seo_og_image","الصورة الافتراضية للمشاركة"],["seo_home_title","عنوان الرئيسية"],["seo_home_description","وصف الرئيسية"],["seo_transfers_title","عنوان التحويلات"],["seo_transfers_description","وصف التحويلات"],["seo_contact_title","عنوان التواصل"],["seo_contact_description","وصف التواصل"],["seo_gift_cards_title","عنوان البطاقات"],["seo_gift_cards_description","وصف البطاقات"]],
  settings: [["site_name","اسم الموقع"],["site_name_en","اسم الموقع بالإنجليزية"]],
  sections: [["section_hero","قسم Hero"],["section_about","قسم من نحن"],["section_services","قسم الخدمات"],["section_gift_cards","قسم البطاقات"],["section_banks","قسم الحسابات"],["section_contact","قسم التواصل"],["nav_home","رابط الرئيسية"],["nav_about","رابط من نحن"],["nav_services","رابط الخدمات"],["nav_gift_cards","رابط Gift Cards"],["nav_transfers","رابط التحويلات"],["nav_contact","رابط التواصل"]],
};
function CmsManager({ category,markDirty }:{category:CmsCategory;markDirty:(dirty:boolean)=>void}) {
  const {done,fail}=useAdminMutations();const cms=useSiteContent();const save=trpc.siteContent.admin.save.useMutation();
  const [draft,setDraft]=useState<Fields>({});
  const [phones,setPhones]=useState<SitePhone[]|null>(null);
  const [hours,setHours]=useState<SiteHour[]|null>(null);
  const dataPhones=phones??cms.phones();const dataHours=hours??cms.hours();
  const change=(key:string,v:string)=>{setDraft(d=>({...d,[key]:v}));markDirty(true)};
  const persist=async(key:string,value:string)=>{try{await save.mutateAsync({key:key as Parameters<typeof save.mutateAsync>[0]["key"],value});await done();setDraft(d=>{const n={...d};delete n[key];return n});markDirty(false)}catch(e){fail(e)}};
  const list= cmsFields[category];
  return <div className="space-y-5"><SectionCard title={labels[category]}><div className="grid gap-5 lg:grid-cols-2">{list.map(([key,label])=>{
    const value=draft[key]??cms.value(key,key.startsWith("section_")||key.startsWith("nav_")?"true":"");
    return <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      {category==="sections"?<Toggle label={label} checked={value!=="false"} onChange={v=>change(key,String(v))}/>:
       category==="images"||key==="seo_og_image"?<ImageField label={label} value={value} onChange={v=>change(key,v)}/>:
       <TextField label={label} value={value} multiline={/description|subtitle/.test(key)} onChange={v=>change(key,v)}/>}
      <div className="mt-3"><SaveButton busy={save.isPending} label="حفظ" onClick={()=>persist(key,value)}/></div>
    </div>})}</div></SectionCard>
    {category==="contact" && <><SectionCard title="أرقام الهاتف - أضف أو أخفِ أو غيّر الترتيب">
      {dataPhones.map((x,i)=><div key={i} className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3">
        <input className={`${normalInput} flex-1`} dir="ltr" value={x.number} onChange={e=>{setPhones(a=>{const n=[...(a??dataPhones)];n[i]={...x,number:e.target.value};return n});markDirty(true)}}/>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={x.visible} onChange={e=>{setPhones(a=>{const n=[...(a??dataPhones)];n[i]={...x,visible:e.target.checked};return n});markDirty(true)}}/>ظاهر</label>
        <button className={`${button} bg-white`} title="أعلى" disabled={i===0} onClick={()=>{setPhones(a=>{const n=[...(a??dataPhones)];[n[i-1],n[i]]=[n[i],n[i-1]];return n});markDirty(true)}}><ArrowUp size={14}/></button>
        <button className={`${button} bg-white`} title="أسفل" disabled={i===dataPhones.length-1} onClick={()=>{setPhones(a=>{const n=[...(a??dataPhones)];[n[i+1],n[i]]=[n[i],n[i+1]];return n});markDirty(true)}}><ArrowDown size={14}/></button>
        <ConfirmButton onClick={()=>{setPhones(dataPhones.filter((_,j)=>i!==j));markDirty(true)}}/>
      </div>)}
      <div className="mt-3 flex flex-wrap gap-2"><button className={`${button} bg-slate-100`} onClick={()=>{setPhones([...dataPhones,{number:"",visible:true}]);markDirty(true)}}><Plus size={16}/>إضافة رقم</button><SaveButton busy={save.isPending} onClick={async()=>{await persist("site_phones",JSON.stringify(dataPhones));setPhones(null)}}/></div>
    </SectionCard><SectionCard title="ساعات العمل">
      {dataHours.map((x,i)=><div key={i} className="mb-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className={normalInput} placeholder="الأيام" value={x.label} onChange={e=>{setHours(a=>{const n=[...(a??dataHours)];n[i]={...x,label:e.target.value};return n});markDirty(true)}}/><input className={normalInput} placeholder="الساعات" value={x.hours} onChange={e=>{setHours(a=>{const n=[...(a??dataHours)];n[i]={...x,hours:e.target.value};return n});markDirty(true)}}/><ConfirmButton onClick={()=>{setHours(dataHours.filter((_,j)=>j!==i));markDirty(true)}}/></div>)}
      <div className="flex flex-wrap gap-2"><button className={`${button} bg-slate-100`} onClick={()=>{setHours([...dataHours,{label:"",hours:""}]);markDirty(true)}}><Plus size={16}/>إضافة فترة</button><SaveButton busy={save.isPending} onClick={async()=>{await persist("site_hours",JSON.stringify(dataHours));setHours(null)}}/></div>
    </SectionCard></>}
    {category==="seo" && <Notice>تظهر تغييرات SEO في وسوم الصفحة داخل المتصفح بعد تحميلها. للحصول على معاينة مؤكدة لدى فيسبوك وواتساب، يلزم تحديث بيانات SEO المولّدة من الخادم أيضًا.</Notice>}
  </div>;
}
function AuditView() {const logs=trpc.finance.admin.activityLogs.list.useQuery();return <SectionCard title="آخر 100 تعديل">
  <div className="divide-y">{logs.data?.map(x=><div className="py-3 text-sm" key={x.id}><div className="flex flex-wrap justify-between gap-2"><b>{x.action} · {x.entityType}</b><time className="text-slate-400">{new Date(x.createdAt).toLocaleString("ar-LY")}</time></div><p className="mt-1 text-slate-500">مستخدم #{x.userId??"—"} · {x.metadata||""}</p></div>)}{!logs.data?.length&&<p className="text-slate-500">لا توجد تعديلات مسجلة أو لم تُحمّل بعد.</p>}</div>
</SectionCard>}
function Summary({ go }:{go:(s:Section)=>void}){const banks=trpc.finance.admin.dashboard.useQuery();const gifts=trpc.giftCards.admin.list.useQuery();const sections:[Section,string|number|undefined][]=[
  ["banks",banks.data?.totalAccounts],["gifts",gifts.data?.length],["services",banks.data?.totalServices],["audit",banks.data?.recentActivity?.length]];
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{sections.map(([s,v])=>{const Icon=icons[s];return <button key={s} onClick={()=>go(s)} className="rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm hover:border-blue-300"><Icon size={23} className="mb-4 text-blue-800"/><p className="text-sm text-slate-500">{labels[s]}</p><p className="mt-2 text-3xl font-black text-slate-900">{v??"—"}</p></button>})}</div>
    <SectionCard title="وصول سريع"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{navigation.filter(x=>x!=="dashboard"&&x!=="audit").map(s=><button key={s} onClick={()=>go(s)} className="rounded-xl border border-slate-200 p-4 text-right text-sm font-bold hover:bg-slate-50">{labels[s]} ←</button>)}</div></SectionCard>
    <Notice>تسجيل الدخول عبر Supabase. المحتوى الحالي متاح للمعاينة، والحفظ غير مفعّل حتى يكتمل نقل البيانات والتحقق من الصلاحيات.</Notice>
    <Notice>صندوق رسائل العملاء القديم غير متصل بهذه النسخة. بياناته السابقة محفوظة في قاعدة البيانات الأصلية ونسخها الاحتياطية، ولم تُنقل إلى المستودع العام. إرسال الرسائل من الواجهات القديمة غير متاح حاليًا؛ استخدم الهاتف أو واتساب الظاهرين في الموقع إلى أن يُربط صندوق رسائل خاص.</Notice>
  </div>;
}

export default function Admin() {
  const navigate=useNavigate();const {user,isLoading,isAuthenticated,logout}=useAuth();
  const [section,setSection]=useState<Section>("dashboard");const [dirty,setDirty]=useState(false);const [menuOpen,setMenuOpen]=useState(false);
  const isAdmin=isAuthenticated&&user?.role==="admin";
  useEffect(()=>{if(!isLoading&&!isAuthenticated)navigate("/login",{replace:true});else if(!isLoading&&isAuthenticated&&user?.role!=="admin")navigate("/",{replace:true})},[isLoading,isAuthenticated,user,navigate]);
  useEffect(()=>{const listener=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=""}};window.addEventListener("beforeunload",listener);return()=>window.removeEventListener("beforeunload",listener)},[dirty]);
  const changeSection=(s:Section)=>{if(dirty&&!window.confirm("لديك تغييرات غير محفوظة. هل تريد المغادرة؟"))return;setDirty(false);setSection(s);setMenuOpen(false)};
  const content: Record<Section, React.ReactNode> = {dashboard:<Summary go={changeSection}/>,banks:<BankManager markDirty={setDirty}/>,gifts:<GiftManager markDirty={setDirty}/>,services:<ServiceManager markDirty={setDirty}/>,contact:<CmsManager category="contact" markDirty={setDirty}/>,images:<CmsManager category="images" markDirty={setDirty}/>,content:<CmsManager category="content" markDirty={setDirty}/>,sections:<CmsManager category="sections" markDirty={setDirty}/>,seo:<CmsManager category="seo" markDirty={setDirty}/>,settings:<CmsManager category="settings" markDirty={setDirty}/>,audit:<AuditView/>};
  if(isLoading)return <div className="grid min-h-screen place-items-center"><Loader2 className="animate-spin text-blue-800"/></div>;
  if(!isAdmin)return null;
  return <div dir="rtl" className="min-h-screen bg-[#F5F7FB] text-slate-900"><aside className={`${menuOpen?"block":"hidden"} fixed inset-y-0 right-0 z-50 w-64 overflow-y-auto bg-[#0B1E35] p-4 text-white shadow-xl lg:block`}>
    <div className="mb-7 border-b border-white/10 px-3 pb-5"><p className="text-xl font-black">الوسيط المعتمد</p><p className="mt-1 text-xs text-blue-200">مركز إدارة الموقع</p></div>
    <nav className="space-y-1">{navigation.map(s=>{const Icon=icons[s];return <button key={s} type="button" onClick={()=>changeSection(s)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm font-bold transition ${section===s?"bg-blue-600 text-white":"text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={18}/>{labels[s]}</button>})}</nav>
    <button onClick={logout} className="mt-8 flex items-center gap-2 px-3 py-3 text-sm text-red-200"><LogOut size={17}/>تسجيل الخروج</button>
  </aside>
  {menuOpen&&<button className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-label="إغلاق القائمة" onClick={()=>setMenuOpen(false)}/>}
  <div className="lg:mr-64"><header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-8">
    <div className="flex items-center gap-3"><button className="rounded-lg bg-slate-100 p-2 lg:hidden" onClick={()=>setMenuOpen(true)}><PanelRightClose size={21}/></button><div><h1 className="text-lg font-black sm:text-2xl">{labels[section]}</h1><p className="text-xs text-slate-500">مرحبًا، {user?.name||"المشرف"}</p></div></div>
    <a href="/" target="_blank" rel="noreferrer" className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}><Globe size={16}/><span className="hidden sm:inline">معاينة الموقع</span><ExternalLink size={13}/></a>
  </header><main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8"><CmsDeploymentBanner />{dirty&&<Notice>لديك تغييرات غير محفوظة.</Notice>}{content[section]}<div className="flex items-center gap-2 pt-6 text-xs text-slate-400"><ShieldCheck size={14}/>هذه اللوحة خاصة بالمدير فقط، وتتحقق واجهاتها من الصلاحيات على الخادم.</div></main></div>
  </div>;
}
