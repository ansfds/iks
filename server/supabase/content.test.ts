import {describe,it,expect,vi,afterEach} from 'vitest';
import {bundledSnapshot} from '../cms/store';
import {encodeTables,decodeTables,contentChanges,persistContent,publicCollections} from './content';
import type {SupabaseClient} from '@supabase/supabase-js';

afterEach(()=>vi.restoreAllMocks());
describe('PostgreSQL content mapping and atomic changes',()=>{
 it('round-trips every legacy field and decimal exactly through the normalized tables',()=>{
  const before=bundledSnapshot().document;
  const tables=encodeTables(before);
  tables.cms_state=[{revision:1,next_ids:before.nextIds,last_operation:before.lastOperation,migration_verified:true}];
  const after=decodeTables(tables,true);
  expect(after.document.collections).toEqual(before.collections);
  expect(after.document.nextIds).toEqual(before.nextIds);
  expect(after.verified).toBe(true);
  expect(tables.gift_card_pricing).toHaveLength(34);
  expect(tables.gift_card_denominations.every(r=>!('selling_price_lyd' in r))).toBe(true);
 });
 it('uses sparse row changes and preserves unrelated collections',()=>{
  const before=bundledSnapshot().document,after=structuredClone(before);
  after.collections.bankAccounts[0].notesAr='Changed notes';
  const changes=contentChanges(before,after);
  expect(Object.keys(changes)).toEqual(['bank_accounts']);
  expect(changes.bank_accounts.upsert).toHaveLength(1);
  expect(changes.bank_accounts.delete).toEqual([]);
  expect(contentChanges(before,before)).toEqual({});
 });
 it('does not expose private prices even if a public decoder receives them',()=>{
  const result=decodeTables(encodeTables(bundledSnapshot().document),false);
  expect(result.document.collections.giftCardDenominations.every(r=>r.sellingPriceLyd===null&&r.manualSellingPriceLyd===null&&r.specialPriceUsd===null)).toBe(true);
  expect(publicCollections('siteContent.public')).toEqual(['siteSettings']);
  expect(publicCollections('giftCards.list')).not.toContain('exchangeRateHistory');
 });
 it('preserves historical audit metadata and verified Auth UUIDs',()=>{
  const before=bundledSnapshot().document,tables=encodeTables(before);
  tables.cms_state=[{revision:2,next_ids:before.nextIds,migration_verified:true}];
  tables.activity_logs=[{id:1,user_id:'49a9fa20-2bdf-45f2-a7a2-325f6df5bc5e',action:'update',entity_type:'gift_cards',metadata:'x'.repeat(463),created_at:'2026-10-28T00:00:00Z'}];
  expect(decodeTables(tables,true).document.audit[0].userId).toBe('49a9fa20-2bdf-45f2-a7a2-325f6df5bc5e');
 });
 it.each([['40001','CONFLICT'],['42501','FORBIDDEN'],['23503','BAD_REQUEST'],['XX000','SERVICE_UNAVAILABLE']])('rejects PostgreSQL %s without confirming a save or leaking details',async(code,expected)=>{
  const db={rpc:vi.fn().mockResolvedValue({data:null,error:{code,message:'PRIVATE_DATABASE_DETAIL'}})} as unknown as SupabaseClient;
  const snapshot=bundledSnapshot();snapshot.document.lastOperation='00000000-0000-4000-8000-000000000001';
  await expect(persistContent(db,snapshot,snapshot.document)).rejects.toMatchObject({code:expected});
  await expect(persistContent(db,snapshot,snapshot.document)).rejects.not.toHaveProperty('message',expect.stringContaining('PRIVATE'));
 });
});
