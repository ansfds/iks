import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const sourceBytes = await readFile('content/site.json');
const source = JSON.parse(sourceBytes);
const manifest = JSON.parse(await readFile('server/supabase/content-manifest.json','utf8'));
const quote = v => "'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const tables = {};
for(const [name,spec] of Object.entries(manifest)) tables[spec.table] = source.collections[name].map(row=>Object.fromEntries(Object.entries(spec.fields).map(([col,f])=>[col,row[f.key]===undefined&&f.key==='isActive'?true:row[f.key]])));
tables.gift_card_pricing = source.collections.giftCardDenominations.map(r=>({id:r.id,selling_price_lyd:r.sellingPriceLyd,manual_selling_price_lyd:r.manualSellingPriceLyd,special_price_usd:r.specialPriceUsd}));
const legacy = JSON.parse(await readFile('../local-app/backups/db-1792527334584.json','utf8'));
// The live content export excludes old auth/session data. Preserve the historical
// activity record in the private admin log, including every original field.
tables.activity_logs = legacy.tables.activity_logs.rows.map(r=>({
 id:Number(r.id),user_id:null,legacy_user_id:r.user_id == null ? null : Number(r.user_id),
 action:r.action,entity_type:r.entity_type,entity_id:r.entity_id == null ? null : Number(r.entity_id),
 metadata:JSON.stringify({legacyRecord:r}),created_at:new Date(String(r.created_at).replace(' ','T').replace(/(?<!Z)$/,'Z')).toISOString(),
}));
let sql = 'begin;\nset constraints all deferred;\n';
const checks=[];
for(const [table,rows] of Object.entries(tables)) {
 sql += `insert into public.${table} select * from jsonb_populate_recordset(null::public.${table},${quote(rows)}) where not (select migration_verified from public.cms_state where id=1) on conflict(id) do nothing;\n`;
 sql += `do $verify$ declare expected jsonb; actual jsonb; begin\nif (select migration_verified from public.cms_state where id=1) then return; end if;\nif (select count(*) from public.${table}) <> ${rows.length} then raise exception 'Count mismatch: ${table}'; end if;\nfor expected in select to_jsonb(r) from jsonb_populate_recordset(null::public.${table},${quote(rows)}) r loop\nselect to_jsonb(r) into actual from public.${table} r where id=(expected->>'id')::bigint;\nif actual is distinct from expected then raise exception 'Value mismatch: ${table}'; end if;\nend loop; end $verify$;\n`;
 checks.push(`jsonb_build_object('table','${table}','current_count',(select count(*) from public.${table}),'initial_import_verified',(select migration_verified from public.cms_state where id=1))`);
}
sql += `select pg_catalog.setval('public.activity_logs_id_seq',greatest(1,(select coalesce(max(id),0) from public.activity_logs)),exists(select 1 from public.activity_logs));\n`;
sql += `do $verify$ begin if (select migration_verified from public.cms_state where id=1) then return; end if; if (select next_ids from public.cms_state where id=1) is distinct from ${quote(source.nextIds)} then raise exception 'next IDs mismatch'; end if; end $verify$;\n`;
sql += `update public.cms_state set migration_verified=true where id=1 and not migration_verified;\ncommit;\nselect jsonb_build_array(${checks.join(',')}) as migration_verification;\n`;
await writeFile('.cache/supabase-import.sql',sql);
await copyFile('content/site.json','.cache/pre-content-migration-source.json');
await writeFile('.cache/supabase-import-plan.json',JSON.stringify({sha256:createHash('sha256').update(sourceBytes).digest('hex'),counts:Object.fromEntries(Object.entries(tables).map(([t,r])=>[t,r.length])),sourceRetained:true},null,2));
console.log(JSON.stringify({counts:Object.fromEntries(Object.entries(tables).map(([t,r])=>[t,r.length])),sourceRetained:true}));
