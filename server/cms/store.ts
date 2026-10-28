import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID, createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import source from "../../content/site.json";
import { validateContent, type ContentDocument } from "./document";
import {
  type ContentRepository,
  type Snapshot,
  type ContentAsset,
} from "./github";
import { type CollectionName, type Collections } from "./models";
import { readSnapshot, persistContent } from '../supabase/content';
import { getDb } from '../queries/connection';

type ContentScope = {
  document: ContentDocument;
  writable: boolean;
  assets: ContentAsset[];
};
const scope = new AsyncLocalStorage<ContentScope>();
const bundled = validateContent(source);
let testRepository: ContentRepository | undefined;
export function installTestRepository(repository?: ContentRepository) {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Test fixture unavailable outside tests");
  testRepository = repository;
}
export function readContent() {
  if (scope.getStore()) return scope.getStore()!.document;
  if (process.env.NODE_ENV === 'test') return structuredClone(bundled);
  throw new Error('Content must be loaded from Supabase within a request');
}
export function bundledSnapshot(): Snapshot {
  return {
    document: structuredClone(bundled),
    revision: createHash("sha1").update(JSON.stringify(source)).digest("hex"),
  };
}
export async function latestSnapshot(request?: Request, headers = new Headers()) {
  return testRepository ? testRepository.read() : readSnapshot(true, request, headers);
}
export async function withContent<T>(
  editor: boolean,
  mutation: boolean,
  request: Request,
  path: string,
  headers: Headers,
  run: () => Promise<T>
) {
  const snapshot = testRepository ? await testRepository.read() : await readSnapshot(editor, request, headers, path);
  const before = structuredClone(snapshot);
  if (mutation) {
    if (request.headers.get("x-cms-revision") !== snapshot.revision)
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "تغيّر المحتوى منذ فتح المحرر. حدّث الصفحة وراجع التعديل قبل حفظه.",
      });
  }
  return scope.run(
    { document: snapshot.document, writable: mutation, assets: [] },
    async () => {
      const result = await run();
      if (mutation && (result as { ok?: boolean }).ok !== false) {
        const document = readContent();
        document.lastOperation = randomUUID();
        document.audit.unshift({
          id: Date.now(),
          userId: 1,
          action: path.split(".").at(-1) || "edit",
          entityType: path,
          metadata: "",
          createdAt: new Date(),
        });
        document.audit = document.audit.slice(0, 100);
        try {
          validateContent(document);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "فشل التحقق من المحتوى: قيمة مكررة، مرجع مفقود أو إعداد غير مسموح.",
          });
        }
        const confirmed = testRepository ? await testRepository.write(
          document,
          snapshot.revision,
          `cms: ${path} (${document.lastOperation})`,
          scope.getStore()!.assets
        ) : await persistContent(getDb(request,headers), before, document);
        headers.set("x-cms-commit", confirmed.commit);
        headers.set("x-cms-revision", confirmed.revision);
      }
      return result;
    }
  );
}
function workingContent() {
  const context = scope.getStore();
  if (!context?.writable)
    throw new Error(
      "Content changes require an authorized mutation transaction"
    );
  return context.document;
}
export function queueAsset(asset: ContentAsset) {
  workingContent();
  scope.getStore()!.assets.push(asset);
}
export function insertRow<K extends CollectionName>(
  name: K,
  value: Partial<Collections[K][number]>
) {
  const document = workingContent();
  const id = document.nextIds[name]++;
  const row = { ...value, id };
  // The complete document schema fills defaults and validates every field before any GitHub write.
  const parsed = validateRow(name, row);
  (document.collections[name] as Array<Collections[K][number]>).push(parsed);
  return parsed;
}
import { collectionsSchema } from "./models";
function validateRow<K extends CollectionName>(
  name: K,
  value: unknown
): Collections[K][number] {
  return collectionsSchema.shape[name].element.parse(
    value
  ) as Collections[K][number];
}
export function updateRow<K extends CollectionName>(
  name: K,
  id: number,
  value: Partial<Collections[K][number]>
) {
  const document = workingContent();
  const rows = document.collections[name] as Array<Collections[K][number]>;
  const index = rows.findIndex(row => row.id === id);
  if (index < 0)
    throw new TRPCError({ code: "NOT_FOUND", message: "السجل غير موجود." });
  const defined = Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  );
  const current = rows[index];
  rows[index] = validateRow(name, {
    ...current,
    ...defined,
    ...("updatedAt" in current ? { updatedAt: new Date() } : {}),
  });
  return rows[index];
}
export function deleteRow<K extends CollectionName>(name: K, id: number) {
  const rows = workingContent().collections[name];
  const index = rows.findIndex(row => row.id === id);
  if (index < 0)
    throw new TRPCError({ code: "NOT_FOUND", message: "السجل غير موجود." });
  rows.splice(index, 1);
}
export function upsertSetting(
  key: string,
  value: string | null,
  type: Collections["siteSettings"][number]["type"] = "text"
) {
  const row = readContent().collections.siteSettings.find(
    row => row.key === key
  );
  return row
    ? updateRow("siteSettings", row.id, {
        value,
        type,
        isPublic: true,
        updatedBy: 1,
      })
    : insertRow("siteSettings", {
        key,
        value,
        type,
        group: "cms",
        isPublic: true,
        updatedBy: 1,
      });
}
