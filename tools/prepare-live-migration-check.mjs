import { readFile,writeFile } from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const source=JSON.parse(await readFile('content/site.json','utf8'));
const marker='فحص حفظ Supabase';
const name=source.collections.siteSettings.find(r=>r.key==='site_name');
const image=source.collections.siteSettings.find(r=>r.key==='hero_image');
const bank=source.collections.bankAccounts.find(r=>r.id===4);
const card=source.collections.giftCards.find(r=>r.slug==='playstation');
const hidden=source.collections.giftCards.find(r=>r.slug==='steam');
const changes=[
 {table:'site_settings',id:name.id,col:'setting_value',before:name.value,after:name.value+' · '+marker},
 {table:'site_settings',id:image.id,col:'setting_value',before:image.value,after:image.value+'?migration_check=1'},
 {table:'bank_accounts',id:bank.id,col:'notes_ar',before:bank.notesAr,after:marker},
 {table:'gift_cards',id:card.id,col:'description',before:card.description,after:marker},
 {table:'gift_cards',id:hidden.id,col:'status',before:hidden.status,after:'HIDDEN'},
];
const lit=v=>v===null?'null':"'"+String(v).replaceAll("'","''")+"'";
const role=`set local role authenticated;\nselect set_config('request.jwt.claims','{"sub":"49a9fa20-2bdf-45f2-a7a2-325f6df5bc5e","role":"authenticated","is_anonymous":false}',true);\n`;
let sql='begin;\n'+role+`do $test$ declare state jsonb; working_row jsonb; changes jsonb:='{}'::jsonb; result jsonb; begin\nselect public.read_content_tables(array['cms_state'])->'cms_state'->0 into state;\n`;
for(const c of changes){
 sql+=`if (select ${c.col} from public.${c.table} where id=${c.id}) is distinct from ${lit(c.before)} then raise exception 'Source changed; skip live check rather than overwrite'; end if;\n`;
 sql+=`select to_jsonb(r)||jsonb_build_object('${c.col}',${lit(c.after)}::text) into working_row from public.${c.table} r where id=${c.id};\nchanges:=jsonb_set(changes,array['${c.table}'],coalesce(changes->'${c.table}','{"upsert":[],"delete":[]}'::jsonb),true);\nchanges:=jsonb_set(changes,array['${c.table}','upsert'],(changes->'${c.table}'->'upsert')||jsonb_build_array(working_row));\n`;
}
sql+=`result:=public.commit_content(state->>'revision',changes,state->'next_ids','${randomUUID()}');\nend $test$;\ncommit;\nselect true as five_live_changes_committed;\n`;
let restore='begin;\n'+role;
for(const c of changes)restore+=`update public.${c.table} set ${c.col}=${lit(c.before)} where id=${c.id} and ${c.col} is not distinct from ${lit(c.after)};\n`;
restore+='commit;\nselect true as test_values_restored_without_overwriting_newer_user_edits;\n';
await writeFile('.cache/live-content-check.sql',sql);
await writeFile('.cache/restore-live-content-check.sql',restore);
await writeFile('.cache/live-content-check-values.json',JSON.stringify(changes,null,2));
console.log('Prepared reversible live PostgreSQL check: text, image URL, bank notes, card description and visibility.');
