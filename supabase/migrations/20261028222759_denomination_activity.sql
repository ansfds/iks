-- Additive: all existing denominations remain active, no data is deleted.
alter table public.gift_card_denominations add column is_active boolean not null default true;
alter policy public_select on public.gift_card_denominations using (is_active and exists(select 1 from public.gift_cards g where g.id=gift_card_id and g.status <> 'HIDDEN'));
alter policy admin_select on public.gift_card_denominations using ((select private.is_content_admin()) or (is_active and exists(select 1 from public.gift_cards g where g.id=gift_card_id and g.status <> 'HIDDEN')));
-- Accept the preceding application version during the deployment window.
CREATE OR REPLACE FUNCTION public.commit_content(p_expected text, p_changes jsonb, p_next_ids jsonb, p_operation uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare current_revision bigint; ready boolean; t text; r jsonb; columns_list text; updates_list text; ids jsonb;
 ordered_tables text[] := array['countries','currencies','exchange_rates','exchange_rate_history','services','commission_rules','bank_accounts','gift_cards','gift_card_denominations','gift_card_pricing','site_settings','social_links','trust_indicators','announcements','gallery_items','news_events','testimonials'];
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
   if t='gift_card_denominations' and not (r ? 'is_active') then
     r := r || jsonb_build_object('is_active',coalesce((select d.is_active from public.gift_card_denominations d where d.id=(r->>'id')::bigint),true));
   end if;
   select string_agg(format('%I',a.attname),',' order by a.attnum),
    string_agg(format('%I=excluded.%I',a.attname,a.attname),',' order by a.attnum) filter(where a.attname<>'id')
   into columns_list,updates_list
   from pg_catalog.pg_attribute a where a.attrelid=format('public.%I',t)::regclass and a.attnum>0 and not a.attisdropped;
   execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) on conflict(id) do update set %s',t,columns_list,columns_list,t,updates_list) using r;
  end loop;
 end loop;
 update public.cms_state set next_ids=p_next_ids,last_operation=p_operation::text,revision=revision+1 where id=1 returning revision into current_revision;
 return jsonb_build_object('revision',current_revision::text,'commit',p_operation::text);
end $function$

;
notify pgrst,'reload schema';

