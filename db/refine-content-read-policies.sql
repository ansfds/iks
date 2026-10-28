-- Each role evaluates one SELECT policy. Public visibility stays the same.
do $$
declare p record;
begin
 for p in select tablename,qual from pg_policies where schemaname='public' and policyname='public_select' loop
  execute format('alter policy public_select on public.%I to anon',p.tablename);
  execute format('alter policy admin_select on public.%I using ((select private.is_content_admin()) or (%s))',p.tablename,p.qual);
 end loop;
end $$;
