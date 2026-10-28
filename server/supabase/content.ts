import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import manifest from './content-manifest.json';
import { collectionsSchema, type CollectionName } from '../cms/models';
import { validateContent, type ContentDocument } from '../cms/document';
import type { Snapshot } from '../cms/github';
import { getDb } from '../queries/connection';

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;
const names = Object.keys(manifest) as CollectionName[];
const prices = ['sellingPriceLyd','manualSellingPriceLyd','specialPriceUsd'] as const;
const priceCols = ['selling_price_lyd','manual_selling_price_lyd','special_price_usd'] as const;
const unavailable = () => new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'تعذر تحميل البيانات من Supabase. أعد المحاولة.' });

export function publicCollections(path: string): CollectionName[] {
  if (path.startsWith('giftCards.')) return ['giftCards','giftCardDenominations','siteSettings'];
  if (path.startsWith('siteContent.') || path === 'seo') return ['siteSettings'];
  if (path.startsWith('gallery.')) return ['galleryItems'];
  if (path.startsWith('news.')) return ['newsEvents'];
  if (path.startsWith('testimonial.')) return ['testimonials'];
  if (path.startsWith('finance.')) return ['countries','currencies','exchangeRates','services','commissionRules','bankAccounts','socialLinks','trustIndicators','announcements','siteSettings'];
  return [];
}

export function decodeTables(tables: Tables, editor: boolean): Snapshot & { verified: boolean } {
  const collections = collectionsSchema.parse(Object.fromEntries(names.map(name => [name, []])));
  for (const name of names) {
    const spec = manifest[name];
    const rows = (tables[spec.table] || []).map(row => Object.fromEntries(Object.entries(spec.fields).map(([col, field]) => [field.key, row[col]])));
    if (name === 'giftCardDenominations') {
      for (const row of rows) {
        const pricing = tables.gift_card_pricing?.find(p => p.id === row.id);
        prices.forEach((key,i) => { row[key] = editor ? pricing?.[priceCols[i]] ?? null : null; });
      }
    }
    Object.assign(collections, { [name]: collectionsSchema.shape[name].parse(rows) });
  }
  const state = tables.cms_state?.[0];
  const document: ContentDocument = {
    version: 1, collections,
    nextIds: state?.next_ids as Record<string,number> || Object.fromEntries(names.map(n=>[n, Math.max(0,...collections[n].map(r=>r.id))+1])),
    lastOperation: String(state?.last_operation || ''),
    audit: (tables.activity_logs || []).map(r=>({ id:Number(r.id),userId:r.user_id ? String(r.user_id) : r.legacy_user_id == null ? null : Number(r.legacy_user_id),action:String(r.action),entityType:String(r.entity_type),metadata:String(r.metadata || ''),createdAt:new Date(String(r.created_at)) })),
  };
  if (editor) validateContent(document);
  return { document, revision: String(state?.revision ?? ''), verified: state?.migration_verified === true };
}

export async function readSnapshot(editor: boolean, request?: Request, headers = new Headers(), path = '') {
  const selected = editor ? names : publicCollections(path);
  const tables = selected.map(name=>manifest[name].table);
  if (editor) tables.push('gift_card_pricing','cms_state','activity_logs');
  try {
    const db = getDb(editor ? request : undefined, headers);
    const { data, error } = await db.rpc('read_content_tables', { p_tables: tables });
    if (error || !data) throw unavailable();
    const result = decodeTables(data as Tables, editor);
    if (editor && !result.revision) throw unavailable();
    return result;
  } catch (error) { if (error instanceof TRPCError) throw error; throw unavailable(); }
}

export function encodeTables(document: ContentDocument): Tables {
  const result: Tables = {};
  for (const name of names) {
    const spec = manifest[name];
    result[spec.table] = document.collections[name].map(row=>Object.fromEntries(Object.entries(spec.fields).map(([col, field])=>[col,(row as unknown as Row)[field.key]])));
  }
  result.gift_card_pricing = document.collections.giftCardDenominations.map(row=>({ id:row.id,...Object.fromEntries(prices.map((k,i)=>[priceCols[i],row[k]])) }));
  return JSON.parse(JSON.stringify(result)) as Tables;
}

export function contentChanges(before: ContentDocument, after: ContentDocument) {
  const old = encodeTables(before), next = encodeTables(after);
  const changes: Record<string,{upsert: Row[]; delete: number[]}> = {};
  for (const [table,rows] of Object.entries(next)) {
    const previous = new Map(old[table].map(row=>[row.id, JSON.stringify(row)]));
    const ids = new Set(rows.map(r=>r.id));
    const upsert = rows.filter(row=>previous.get(row.id)!==JSON.stringify(row));
    const deleted = old[table].filter(row=>!ids.has(row.id)).map(row=>Number(row.id));
    if (upsert.length || deleted.length) changes[table] = {upsert, delete:deleted};
  }
  return changes;
}

export async function persistContent(db: SupabaseClient, before: Snapshot, after: ContentDocument) {
  const { data, error } = await db.rpc('commit_content', {
    p_expected: before.revision, p_changes: contentChanges(before.document,after),
    p_next_ids: after.nextIds, p_operation: after.lastOperation,
  });
  if (error) {
    if (error.code === '40001') throw new TRPCError({code:'CONFLICT',message:'تغيّر المحتوى. حدّث الصفحة وراجع التعديل قبل حفظه.'});
    if (error.code === '42501') throw new TRPCError({code:'FORBIDDEN',message:'هذا الحساب غير مصرح له بحفظ المحتوى.'});
    if (['23505','23503','23514','22003'].includes(error.code)) throw new TRPCError({code:'BAD_REQUEST',message:'قيمة مكررة أو مرجع مفقود أو قيمة غير صالحة. لم تُحفظ التغييرات.'});
    throw new TRPCError({code:'SERVICE_UNAVAILABLE',message:'لم يتم تأكيد الحفظ. حدّث الصفحة للتحقق قبل المحاولة مجددًا.'});
  }
  if (!data?.revision || !data?.commit) throw unavailable();
  return data as {revision:string;commit:string};
}
