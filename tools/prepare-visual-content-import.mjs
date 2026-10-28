// Capture is read from the actual rendered public pages. Only absent settings
// are added. Run the generated SQL after the new application is deployed.
import {readFile,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
await build({entryPoints:['server/site-content-fields.ts'],outfile:'.cache/visual-fields.mjs',bundle:true,platform:'node',format:'esm'});
const {CONTENT_KEYS,validateValue}=await import(pathToFileURL(path.resolve('.cache/visual-fields.mjs')).href);
const values=JSON.parse(await readFile('.cache/visual-content-values.json','utf8'));
const prepared=[];
for(const [key,value] of Object.entries(values)){
 if(!CONTENT_KEYS.includes(key))throw Error('Unknown captured field: '+key);
 validateValue(key,value);
 prepared.push({key,value,type:key.endsWith('_image')||key.endsWith('_background_url')?'image':'text'});
}
const literal="'"+JSON.stringify(prepared).replaceAll("'","''")+"'::jsonb";
const sql=`begin;
do $import$ declare item jsonb; next_id bigint; added integer:=0; begin
 select (next_ids->>'siteSettings')::bigint into next_id from public.cms_state where id=1 for update;
 next_id:=greatest(next_id,(select coalesce(max(id),0)+1 from public.site_settings));
 for item in select value from jsonb_array_elements(${literal}) loop
  if not exists(select 1 from public.site_settings where lower(setting_key)=lower(item->>'key')) then
   insert into public.site_settings(id,setting_key,setting_value,setting_type,setting_group,is_public,sort_order)
   values(next_id,item->>'key',item->>'value',item->>'type','visual',true,0);
   next_id:=next_id+1; added:=added+1;
  end if;
 end loop;
 update public.cms_state set next_ids=jsonb_set(next_ids,'{siteSettings}',to_jsonb(next_id)) where id=1;
 raise notice 'Added % existing display fields; existing values retained',added;
end $import$;
commit;
select count(*) as settings_after_import from public.site_settings;
`;
await writeFile('.cache/import-visual-content.sql',sql);
console.log(JSON.stringify({capturedFields:prepared.length,existingValuesOverwritten:false,generatedSql:'.cache/import-visual-content.sql'}));
