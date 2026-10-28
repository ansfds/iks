import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Monitor,
  Smartphone,
  Pencil,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { VISUAL_FIELDS, type VisualKey } from "@contracts/visual-content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ImageField,
  SaveButton,
  TextField,
  Toggle,
  inputClass,
  buttonClass,
} from "./AdminFields";
import { useAdminSave } from "@/hooks/useAdminSave";

type Field = {
  key: VisualKey;
  value: string;
  kind: "image" | "text";
  label: string;
};
type Section = {
  id: string;
  title: string;
  visibility?: string;
  link?: string;
  fields: Field[];
};
const pages = [
  ["/", "الرئيسية"],
  ["/about", "من نحن"],
  ["/vision-mission", "الرؤية والرسالة"],
  ["/transfers", "الحسابات المصرفية"],
  ["/contact", "التواصل"],
] as const;
export function VisualEditor({
  markDirty,
  onNavigate,
}: {
  markDirty: (value: boolean) => void;
  onNavigate: (path: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1280, height: 800 });
  const scale = Math.min(1, Math.max(1, canvasSize.width) / 1280);
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setCanvasSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  const cleanup = useRef<() => void>(() => {});
  const [page, setPage] = useState("/"),
    [device, setDevice] = useState<"desktop" | "mobile">("desktop"),
    [version, setVersion] = useState(0),
    [sections, setSections] = useState<Section[]>([]),
    [selected, setSelected] = useState(""),
    [draft, setDraft] = useState<Record<string, string>>({});
  const [image, setImage] = useState<Field | null>(null),
    [imageUrl, setImageUrl] = useState(""),
    [imageValid, setImageValid] = useState(false);
  const [ready, setReady] = useState(false);
  const settings = trpc.siteContent.admin.list.useQuery();
  const save = trpc.siteContent.admin.saveBatch.useMutation();
  const { done, fail } = useAdminSave();
  const pending = Object.keys(draft).length;
  const current = sections.find(s => s.id === selected) || sections[0];
  const changed = (key: string, value: string) => {
    setDraft(d => ({ ...d, [key]: value }));
    markDirty(true);
  };
  const editImage = (field: Field) => {
    setImage(field);
    setImageUrl(draft[field.key] ?? field.value);
    setImageValid(false);
  };
  const pick = (id: string) => {
    setSelected(id);
    const node = frame.current?.contentDocument?.querySelector<HTMLElement>(
      `[data-editor-section="${id}"]`
    );
    node?.scrollIntoView({ behavior: "instant", block: "start" });
  };
  const refresh = () => {
    if (pending && !window.confirm("لديك تغييرات غير محفوظة. هل تريد إلغاءها؟"))
      return;
    setDraft({});
    markDirty(false);
    setReady(false);
    setVersion(v => v + 1);
  };
  const switchPage = (next: string) => {
    if (
      pending &&
      !window.confirm("لديك تغييرات غير محفوظة. هل تريد المغادرة؟")
    )
      return;
    setDraft({});
    markDirty(false);
    setSections([]);
    setSelected("");
    setReady(false);
    setPage(next);
  };
  const setup = () => {
    cleanup.current();
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const style = doc.createElement("style");
    style.textContent = `[data-cms-key],[data-cms-image]{cursor:pointer!important} [data-cms-key]:hover,[data-cms-image]:hover{outline:2px dashed #3b82f6;outline-offset:4px} [contenteditable]:focus{outline:3px solid #2563eb;outline-offset:4px} [data-editor-section]{scroll-margin-top:90px} [data-editor-hidden=true]{opacity:.5;outline:2px dashed #94a3b8} [class*="-animate"],.stat-item,.gallery-item{opacity:1!important;transform:none!important}`;
    doc.head.append(style);
    let timer: number | undefined;
    const scan = () => {
      const found = Array.from(
        doc.querySelectorAll<HTMLElement>("[data-editor-section]")
      ).map(node => {
        const fields = Array.from(
          node.querySelectorAll<HTMLElement>("[data-cms-key],[data-cms-image]")
        )
          .filter(el => el.closest("[data-editor-section]") === node)
          .flatMap(el => {
            const key = (el.dataset.cmsKey || el.dataset.cmsImage) as VisualKey;
            if (!(key in VISUAL_FIELDS)) return [];
            const spec = VISUAL_FIELDS[key];
            const value =
              spec.kind === "image"
                ? el instanceof doc.defaultView!.HTMLImageElement
                  ? (el as HTMLImageElement).currentSrc ||
                    el.getAttribute("src") ||
                    ""
                  : el.querySelector("img")?.src || ""
                : el.textContent?.trim() || "";
            return [{ key, value, kind: spec.kind, label: spec.label }];
          });
        return {
          id: node.dataset.editorSection!,
          title:
            node.dataset.editorLabel ||
            node.querySelector("h2")?.textContent ||
            "",
          visibility: node.dataset.editorVisibility,
          link: node.dataset.editorLink,
          fields,
        };
      });
      setSections(old =>
        JSON.stringify(old) === JSON.stringify(found) ? old : found
      );
      setReady(found.length > 0);
    };
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 100);
    });
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const click = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const region = target.closest<HTMLElement>("[data-editor-section]");
      if (region) setSelected(region.dataset.editorSection!);
      const element = target.closest<HTMLElement>(
        "[data-cms-key],[data-cms-image]"
      );
      if (element) {
        const key = (element.dataset.cmsKey ||
          element.dataset.cmsImage) as VisualKey;
        if (key in VISUAL_FIELDS) {
          if (VISUAL_FIELDS[key].kind === "image") {
            event.preventDefault();
            event.stopPropagation();
            const value =
              element.getAttribute("src") ||
              element.querySelector("img")?.src ||
              "";
            setImage({
              key,
              kind: "image",
              label: VISUAL_FIELDS[key].label,
              value,
            });
            setImageUrl(value);
            setImageValid(false);
          } else {
            event.preventDefault();
            event.stopPropagation();
            element.contentEditable = "plaintext-only";
            element.setAttribute("role", "textbox");
            element.setAttribute("aria-label", VISUAL_FIELDS[key].label);
            element.focus();
          }
        }
      } else if (target.closest("a,button,form")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const input = (event: Event) => {
      const target = event.target as HTMLElement;
      const key = target.dataset.cmsKey;
      if (key && key in VISUAL_FIELDS) {
        setDraft(d => ({ ...d, [key]: target.textContent || "" }));
        markDirty(true);
      }
    };
    const paste = (event: ClipboardEvent) => {
      if ((event.target as HTMLElement).isContentEditable) {
        event.preventDefault();
        const text = event.clipboardData?.getData("text/plain") || "";
        const selection = doc.getSelection();
        if (selection?.rangeCount) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(doc.createTextNode(text));
          (event.target as HTMLElement).dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      }
    };
    doc.addEventListener("click", click, true);
    doc.addEventListener("input", input);
    doc.addEventListener("paste", paste);
    cleanup.current = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      doc.removeEventListener("click", click, true);
      doc.removeEventListener("input", input);
      doc.removeEventListener("paste", paste);
    };
    scan();
  };
  useEffect(() => () => cleanup.current(), []);
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    for (const [key, value] of Object.entries(draft)) {
      for (const el of doc.querySelectorAll<HTMLElement>(
        `[data-cms-key="${key}"]`
      ))
        if (doc.activeElement !== el && el.textContent !== value)
          el.textContent = value;
      for (const el of doc.querySelectorAll<HTMLImageElement>(
        `img[data-cms-image="${key}"]`
      ))
        if (value && el.getAttribute("src") !== value) el.src = value;
    }
    for (const section of sections) {
      if (!section.visibility) continue;
      const node = doc.querySelector<HTMLElement>(
        `[data-editor-section="${section.id}"]`
      );
      if (node) {
        const value =
          draft[section.visibility] ??
          settings.data?.find(r => r.key === section.visibility)?.value ??
          "true";
        node.dataset.editorHidden = String(value === "false");
        if (value === "false") node.style.removeProperty("display");
      }
    }
  }, [draft, sections, settings.data]);
  const persist = async () => {
    try {
      await save.mutateAsync({
        changes: Object.entries(draft).map(([key, value]) => ({
          key: key as Parameters<
            typeof save.mutateAsync
          >[0]["changes"][number]["key"],
          value,
        })),
      });
      setDraft({});
      markDirty(false);
      await done();
      setVersion(v => v + 1);
    } catch (e) {
      fail(e);
    }
  };
  return (
    <div className="space-y-4" data-testid="visual-editor">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">المحرر البصري لمحتوى الموقع</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              هذه معاينة الموقع الحقيقي. اضغط على النص لتعديله، أو على الصورة
              لتغييرها.
            </p>
          </div>
          <SaveButton
            busy={save.isPending}
            disabled={!pending}
            onClick={persist}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            aria-label="صفحة المعاينة"
            className={`${inputClass} max-w-52`}
            value={page}
            onChange={e => switchPage(e.target.value)}
          >
            {pages.map(([path, label]) => (
              <option value={path} key={path}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl border p-1">
            <button
              aria-pressed={device === "desktop"}
              className={`${buttonClass} ${device === "desktop" ? "bg-blue-50 text-blue-800" : ""}`}
              onClick={() => setDevice("desktop")}
            >
              <Monitor size={17} />
              Desktop
            </button>
            <button
              aria-pressed={device === "mobile"}
              className={`${buttonClass} ${device === "mobile" ? "bg-blue-50 text-blue-800" : ""}`}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone size={17} />
              Mobile
            </button>
          </div>
          <button className={`${buttonClass} bg-slate-100`} onClick={refresh}>
            <RefreshCw size={16} />
            تحديث المعاينة
          </button>
        </div>
        {pending > 0 && (
          <p className="mt-3 text-sm font-bold text-amber-700">
            لديك تغييرات غير محفوظة ({pending}).
          </p>
        )}
        {settings.isError && (
          <p role="alert" className="mt-3 text-red-700">
            تعذر قراءة المحتوى. حدّث الصفحة قبل التحرير.
          </p>
        )}
      </section>
      <div className="grid items-start gap-4 xl:grid-cols-[250px_1fr]">
        <aside className="space-y-4 xl:sticky xl:top-28">
          <div className="rounded-2xl border bg-white p-3">
            <p className="mb-2 px-2 text-sm font-black">أقسام الصفحة</p>
            {!ready && (
              <p className="p-3 text-sm text-slate-500">
                جارٍ تحميل معاينة الموقع…
              </p>
            )}
            {sections.map(s => (
              <button
                key={s.id}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-right text-sm font-bold ${current?.id === s.id ? "bg-blue-50 text-blue-800" : "hover:bg-slate-50"}`}
                onClick={() => pick(s.id)}
              >
                {s.title}
              </button>
            ))}
          </div>
          {current && (
            <div className="space-y-4 rounded-2xl border bg-white p-4">
              <h3 className="font-black">{current.title}</h3>
              {current.visibility && (
                <Toggle
                  label="إظهار هذا القسم"
                  checked={
                    (draft[current.visibility] ??
                      settings.data?.find(r => r.key === current.visibility)
                        ?.value ??
                      "true") !== "false"
                  }
                  onChange={v => changed(current.visibility!, String(v))}
                />
              )}
              <p className="text-xs leading-6 text-slate-500">
                القسم المخفي يظهر باهتًا هنا لتتمكن من تعديله وإظهاره مجددًا.
              </p>
              {current.fields.map(field =>
                field.kind === "image" ? (
                  <button
                    key={field.key}
                    className={`${buttonClass} w-full bg-slate-100`}
                    onClick={() => editImage(field)}
                  >
                    <ImageIcon size={16} />
                    تغيير {field.label}
                  </button>
                ) : (
                  <TextField
                    key={field.key}
                    label={field.label}
                    value={draft[field.key] ?? field.value}
                    multiline={
                      !field.key.endsWith("_cta") &&
                      !field.key.endsWith("_title") &&
                      !field.key.endsWith("_label")
                    }
                    onChange={v => changed(field.key, v)}
                  />
                )
              )}
              {current.link && (
                <button
                  className={`${buttonClass} bg-blue-50 text-blue-800`}
                  onClick={() => onNavigate(current.link!)}
                >
                  <ExternalLink size={16} />
                  إدارة العناصر
                </button>
              )}
              {current.fields.some(f => f.kind === "text") && (
                <p className="flex items-center gap-2 text-xs text-blue-700">
                  <Pencil size={13} />
                  يمكنك تعديل النص مباشرة داخل المعاينة.
                </p>
              )}
            </div>
          )}
        </aside>
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-200 p-2">
          <div
            ref={canvas}
            className="relative mx-auto h-[78vh] min-h-[600px] overflow-hidden bg-white shadow-lg"
            style={{
              width: device === "mobile" ? 390 : "100%",
              maxWidth: device === "mobile" ? 390 : undefined,
              minWidth: device === "mobile" ? 390 : undefined,
            }}
          >
            <iframe
              ref={frame}
              key={page + version}
              title="معاينة الموقع الحقيقية"
              src={page + "?visual_editor_preview=1"}
              onLoad={setup}
              className="absolute right-0 top-0 block border-0"
              style={{
                width: device === "desktop" ? 1280 : 390,
                height:
                  device === "desktop"
                    ? Math.ceil(canvasSize.height / scale)
                    : canvasSize.height,
                transform: device === "desktop" ? `scale(${scale})` : undefined,
                transformOrigin: "top right",
              }}
            />
          </div>
        </div>
      </div>
      <Dialog
        open={image !== null}
        onOpenChange={open => {
          if (!open) setImage(null);
        }}
      >
        <DialogContent dir="rtl" className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader className="text-right sm:text-right pr-6">
            <DialogTitle>تغيير الصورة — {image?.label}</DialogTitle>
            <DialogDescription>
              راجع الصورة قبل اعتمادها، ثم اضغط حفظ التعديلات في المحرر.
            </DialogDescription>
          </DialogHeader>
          <ImageField
            label="رابط الصورة"
            value={imageUrl}
            onChange={setImageUrl}
            onValidity={setImageValid}
          />
          <DialogFooter>
            <SaveButton
              label="اعتماد الصورة في المعاينة"
              disabled={!imageValid}
              onClick={() => {
                if (image) {
                  changed(image.key, imageUrl);
                  setImage(null);
                }
              }}
            />
            <button
              className={`${buttonClass} bg-slate-100`}
              onClick={() => setImage(null)}
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
