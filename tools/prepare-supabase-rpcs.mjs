import { readFile, writeFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('server/supabase/content-manifest.json','utf8'));
const tableFields = Object.fromEntries(Object.values(manifest).map(x=>[x.table,x.fields]));
tableFields.gift_card_pricing = {id:{type:'bigint'},selling_price_lyd:{type:'numeric'},manual_selling_price_lyd:{type:'numeric'},special_price_usd:{type:'numeric'}};
const order = ['countries','currencies','exchange_rates','exchange_rate_history','services','commission_rules','bank_accounts','gift_cards','gift_card_denominations','gift_card_pricing','site_settings','social_links','trust_indicators','announcements','gallery_items','news_events','testimonials'];
const literals = arr=>arr.map(t=>`'${t}'`).join(',');
let sql = await readFile('.cache/content-schema-base.sql','utf8');
sql += `
-- The existing event trigger still enables RLS; API callers cannot execute it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create function public.read_content_tables(p_tables text[]) returns jsonb language plpgsql security invoker set search_path='' as $$
declare t text; rows_json jsonb; result jsonb := '{}'::jsonb; expression text;
begin
 if cardinality(p_tables)>20 then raise exception 'Too many tables'; end if;
 -- An admin snapshot is consistent with the revision used for compare-and-swap.
 if auth.uid() is not null then
  if private.is_content_admin() then perform id from public.cms_state where id=1 for share; end if;
 end if;
 foreach t in array p_tables loop
  if not(t=any(array[${literals([...order,'cms_state','activity_logs'])}])) then raise exception 'Invalid content table'; end if;
  expression := 'to_jsonb(r)';
  case t
${Object.entries(tableFields).filter(([,fields])=>Object.values(fields).some(f=>f.type==='numeric')).map(([t,fields])=>`  when '${t}' then expression := 'to_jsonb(r) || jsonb_build_object(${Object.entries(fields).filter(([,f])=>f.type==='numeric').map(([col])=>`''${col}'', r.${col}::text`).join(', ')})';`).join('\n')}
  else null;
  end case;
  if t='activity_logs' then
   execute 'select coalesce(jsonb_agg(to_jsonb(r)), ''[]''::jsonb) from (select * from public.activity_logs order by created_at desc, id desc limit 100) r' into rows_json;
  else
   execute format('select coalesce(jsonb_agg(%s order by r.id), ''[]''::jsonb) from public.%I r',expression,t) into rows_json;
  end if;
  result := result || jsonb_build_object(t,rows_json);
 end loop;
 return result;
end $$;
revoke all on function public.read_content_tables(text[]) from public;
grant execute on function public.read_content_tables(text[]) to anon, authenticated;

-- Invoker triggers preserve RLS and invalidate stale editors, including direct API edits.
create function private.content_changed() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.cms_state set revision=revision+1 where id=1;
 if auth.uid() is not null then
  insert into public.activity_logs(user_id,action,entity_type,entity_id)
  values(auth.uid(),lower(TG_OP),TG_TABLE_NAME,coalesce(new.id,old.id));
 end if;
 return coalesce(new,old);
end $$;
revoke all on function private.content_changed() from public,anon,authenticated;
${order.map(t=>`create trigger content_changed after insert or update or delete on public.${t} for each row execute function private.content_changed();`).join('\n')}

create function public.commit_content(p_expected text, p_changes jsonb, p_next_ids jsonb, p_operation uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare current_revision bigint; ready boolean; t text; r jsonb; columns_list text; updates_list text; ids jsonb;
 ordered_tables text[] := array[${literals(order)}];
begin
 if not private.is_content_admin() then raise insufficient_privilege using message='Admin required'; end if;
 select revision,migration_verified into current_revision,ready from public.cms_state where id=1 for update;
 if not coalesce(ready,false) then raise exception 'Content migration not verified'; end if;
 if p_expected is distinct from current_revision::text then raise sqlstate '40001' using message='Content revision conflict'; end if;
 if jsonb_typeof(p_changes) <> 'object' or jsonb_typeof(p_next_ids) <> 'object' then raise exception 'Invalid changes'; end if;
 for t in select jsonb_object_keys(p_changes) loop
  if not(t=any(ordered_tables)) then raise exception 'Invalid content table'; end if;
 end loop;
 -- Delete children first. No TRUNCATE and no replacement of unrelated rows.
 foreach t in array (select array_agg(x order by n desc) from unnest(ordered_tables) with ordinality a(x,n)) loop
  ids := coalesce(p_changes->t->'delete','[]'::jsonb);
  if jsonb_array_length(ids)>0 then
   execute format('delete from public.%I where id in (select value::bigint from jsonb_array_elements_text($1))',t) using ids;
  end if;
 end loop;
 foreach t in array ordered_tables loop
  for r in select value from jsonb_array_elements(coalesce(p_changes->t->'upsert','[]'::jsonb)) loop
   select string_agg(format('%I',a.attname),',' order by a.attnum),
    string_agg(format('%I=excluded.%I',a.attname,a.attname),',' order by a.attnum) filter(where a.attname<>'id')
   into columns_list,updates_list
   from pg_catalog.pg_attribute a where a.attrelid=format('public.%I',t)::regclass and a.attnum>0 and not a.attisdropped;
   execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) on conflict(id) do update set %s',t,columns_list,columns_list,t,updates_list) using r;
  end loop;
 end loop;
 update public.cms_state set next_ids=p_next_ids,last_operation=p_operation::text,revision=revision+1 where id=1 returning revision into current_revision;
 return jsonb_build_object('revision',current_revision::text,'commit',p_operation::text);
end $$;
revoke all on function public.commit_content(text,jsonb,jsonb,uuid) from public,anon;
grant execute on function public.commit_content(text,jsonb,jsonb,uuid) to authenticated;

-- Permanent image URLs; the admin JWT is checked by Storage RLS.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media','site-media',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do nothing;
create policy site_media_public_read on storage.objects for select to anon,authenticated using(bucket_id='site-media');
create policy site_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id='site-media' and (select private.is_content_admin()));
create policy site_media_admin_update on storage.objects for update to authenticated using(bucket_id='site-media' and (select private.is_content_admin())) with check(bucket_id='site-media' and (select private.is_content_admin()));
create policy site_media_admin_delete on storage.objects for delete to authenticated using(bucket_id='site-media' and (select private.is_content_admin()));
notify pgrst,'reload schema';
`;
await writeFile('db/supabase-content.sql',sql);
console.log('Prepared PostgreSQL schema, invoker RPCs, RLS and Storage policies.');
