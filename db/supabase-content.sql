-- PostgreSQL: reviewed content model; Supabase Auth replaces legacy user/session tables.
create table public.countries (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  name_ar text not null check (length(name_ar) <= 255),
  name_en text check (length(name_en) <= 255),
  slug text not null check (length(slug) <= 180),
  iso_code text check (length(iso_code) <= 8),
  flag_emoji text check (length(flag_emoji) <= 16),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.countries enable row level security;

create table public.currencies (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  symbol text not null check (length(symbol) <= 24),
  name_ar text not null check (length(name_ar) <= 255),
  name_en text check (length(name_en) <= 255),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.currencies enable row level security;

create table public.exchange_rates (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  currency_id bigint not null,
  buy_price numeric check (buy_price >= 0 and buy_price <= 999999999999),
  sell_price numeric check (sell_price >= 0 and sell_price <= 999999999999),
  calculator_rate numeric check (calculator_rate >= 0 and calculator_rate <= 999999999999),
  is_active boolean not null default true,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exchange_rates enable row level security;

create table public.exchange_rate_history (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  currency_id bigint not null,
  field text not null check (field in ('buy', 'sell', 'calculator')),
  old_value numeric check (old_value >= 0 and old_value <= 999999999999),
  new_value numeric check (new_value >= 0 and new_value <= 999999999999),
  changed_by bigint,
  created_at timestamptz not null default now()
);
alter table public.exchange_rate_history enable row level security;

create table public.services (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  name_ar text not null check (length(name_ar) <= 255),
  name_en text check (length(name_en) <= 255),
  description_ar text check (length(description_ar) <= 24000),
  description_en text check (length(description_en) <= 24000),
  image_url text check (length(image_url) <= 500),
  icon text check (length(icon) <= 80),
  href text check (length(href) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  is_calculator_enabled boolean not null default false,
  calculator_currency_id bigint,
  calculator_rate_type text not null default 'calculator' check (calculator_rate_type in ('buy', 'sell', 'calculator')),
  created_by bigint,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.services enable row level security;

create table public.commission_rules (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  service_id bigint not null,
  minimum_amount numeric not null check (minimum_amount >= 0 and minimum_amount <= 999999999999),
  maximum_amount numeric not null check (maximum_amount >= 0 and maximum_amount <= 999999999999),
  commission_type text not null check (commission_type in ('percentage', 'fixed')),
  commission_value numeric not null check (commission_value >= 0 and commission_value <= 999999999999),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by bigint,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.commission_rules enable row level security;

create table public.bank_accounts (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  country_id bigint not null,
  currency_id bigint not null,
  bank_name_ar text not null check (length(bank_name_ar) <= 255),
  bank_name_en text check (length(bank_name_en) <= 255),
  account_name text not null check (length(account_name) <= 255),
  account_number text not null check (length(account_number) <= 255),
  iban text check (length(iban) <= 255),
  bank_logo_url text check (length(bank_logo_url) <= 500),
  notes_ar text check (length(notes_ar) <= 24000),
  notes_en text check (length(notes_en) <= 24000),
  slug text not null check (length(slug) <= 180),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by bigint,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bank_accounts enable row level security;

create table public.gift_cards (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  name text not null check (length(name) <= 255),
  display_name text not null check (length(display_name) <= 255),
  slug text not null check (length(slug) <= 180),
  description text check (length(description) <= 24000),
  region_code text not null default 'US' check (length(region_code) <= 20),
  region_label text not null default 'ريجن أمريكي' check (length(region_label) <= 120),
  currency text not null default 'USD' check (length(currency) <= 12),
  image_url text check (length(image_url) <= 500),
  background_url text check (length(background_url) <= 500),
  status text not null default 'COMING_SOON' check (status in ('AVAILABLE', 'COMING_SOON', 'UNAVAILABLE', 'HIDDEN')),
  sort_order integer not null default 0,
  created_by bigint,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;

create table public.gift_card_denominations (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  gift_card_id bigint not null,
  face_value numeric not null check (face_value >= 0 and face_value <= 999999999999),
  currency text not null default 'USD' check (length(currency) <= 12),
  is_available boolean not null default true,
  is_most_popular boolean not null default false,
  highlight_effect text not null default 'NONE' check (highlight_effect in ('NONE', 'FLAME')),
  sort_order integer not null default 0,
  created_by bigint,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gift_card_denominations enable row level security;

create table public.site_settings (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  setting_key text not null check (length(setting_key) <= 180),
  setting_value text check (length(setting_value) <= 24000),
  setting_type text not null default 'text' check (setting_type in ('text', 'url', 'image', 'json')),
  setting_group text default 'general' check (length(setting_group) <= 120),
  is_public boolean not null default true,
  sort_order integer not null default 0,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

create table public.social_links (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  platform text not null check (length(platform) <= 80),
  label text check (length(label) <= 120),
  url text not null check (length(url) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.social_links enable row level security;

create table public.trust_indicators (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  label_ar text not null check (length(label_ar) <= 255),
  label_en text check (length(label_en) <= 255),
  value text check (length(value) <= 80),
  unit_ar text check (length(unit_ar) <= 80),
  unit_en text check (length(unit_en) <= 80),
  description_ar text check (length(description_ar) <= 24000),
  description_en text check (length(description_en) <= 24000),
  icon text check (length(icon) <= 80),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.trust_indicators enable row level security;

create table public.announcements (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  title_ar text not null check (length(title_ar) <= 255),
  title_en text check (length(title_en) <= 255),
  body_ar text check (length(body_ar) <= 24000),
  body_en text check (length(body_en) <= 24000),
  level text not null default 'info' check (level in ('info', 'success', 'warning')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  updated_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.announcements enable row level security;

create table public.gallery_items (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  title text not null check (length(title) <= 255),
  title_ar text check (length(title_ar) <= 255),
  description text check (length(description) <= 24000),
  description_ar text check (length(description_ar) <= 24000),
  image_url text not null check (length(image_url) <= 500),
  category text not null default 'all' check (length(category) <= 50),
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.gallery_items enable row level security;

create table public.news_events (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  title text not null check (length(title) <= 255),
  title_ar text check (length(title_ar) <= 255),
  excerpt text check (length(excerpt) <= 24000),
  excerpt_ar text check (length(excerpt_ar) <= 24000),
  content text not null check (length(content) <= 24000),
  content_ar text check (length(content_ar) <= 24000),
  image_url text check (length(image_url) <= 500),
  event_date timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.news_events enable row level security;

create table public.testimonials (
  id bigint primary key check (id > 0 and id <= 9007199254740991),
  author_name text not null check (length(author_name) <= 255),
  author_name_ar text check (length(author_name_ar) <= 255),
  role text check (length(role) <= 255),
  role_ar text check (length(role_ar) <= 255),
  quote text not null check (length(quote) <= 24000),
  quote_ar text check (length(quote_ar) <= 24000),
  rating integer not null default 5,
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;


create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create table private.content_admins (user_id uuid primary key references auth.users(id), active boolean not null default true);
alter table private.content_admins enable row level security;
grant select on private.content_admins to authenticated;
create policy admin_can_read_own_membership on private.content_admins for select to authenticated using (user_id = (select auth.uid()));
insert into private.content_admins(user_id) select id from auth.users where id = '49a9fa20-2bdf-45f2-a7a2-325f6df5bc5e' and not is_anonymous;
do $$ begin if not exists(select 1 from private.content_admins) then raise exception 'Expected Auth admin missing'; end if; end $$;
create function private.is_content_admin() returns boolean language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from private.content_admins where user_id = (select auth.uid()) and active) and not coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false);
$$;
revoke all on function private.is_content_admin() from public, anon;
grant execute on function private.is_content_admin() to authenticated;

create table public.gift_card_pricing (
 id bigint primary key references public.gift_card_denominations(id) on delete cascade,
 selling_price_lyd numeric check(selling_price_lyd >= 0 and selling_price_lyd <= 999999999999),
 manual_selling_price_lyd numeric check(manual_selling_price_lyd >= 0 and manual_selling_price_lyd <= 999999999999),
 special_price_usd numeric check(special_price_usd >= 0 and special_price_usd <= 999999999999)
);
create table public.cms_state (id integer primary key check(id=1), revision bigint not null default 1, next_ids jsonb not null, last_operation text not null default '', migration_verified boolean not null default false);
insert into public.cms_state(id,next_ids) values (1, '{"countries":2,"currencies":2,"exchangeRates":1,"exchangeRateHistory":1,"services":1,"commissionRules":1,"bankAccounts":5,"giftCards":10,"giftCardDenominations":35,"siteSettings":14,"socialLinks":1,"trustIndicators":1,"announcements":1,"galleryItems":1,"newsEvents":1,"testimonials":1}'::jsonb);
create table public.activity_logs (id bigint generated by default as identity primary key, user_id uuid references auth.users(id), legacy_user_id bigint, action text not null, entity_type text not null, entity_id bigint, metadata text not null default '', created_at timestamptz not null default now());
create index activity_logs_created_idx on public.activity_logs(created_at desc);
create index activity_logs_user_idx on public.activity_logs(user_id);
create table public.contacts (id bigint generated by default as identity primary key, student_name text not null, parent_name text not null, email text not null, phone text, grade text, message text not null, language text not null default 'ar' check(language in ('ar','en')), created_at timestamptz not null default now(), is_read boolean not null default false);
alter table public.countries enable row level security;
revoke all on public.countries from public, anon, authenticated;
grant select, insert, update, delete on public.countries to authenticated;
create policy admin_select on public.countries for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.countries for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.countries for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.countries for delete to authenticated using ((select private.is_content_admin()));
alter table public.currencies enable row level security;
revoke all on public.currencies from public, anon, authenticated;
grant select, insert, update, delete on public.currencies to authenticated;
create policy admin_select on public.currencies for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.currencies for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.currencies for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.currencies for delete to authenticated using ((select private.is_content_admin()));
alter table public.exchange_rates enable row level security;
revoke all on public.exchange_rates from public, anon, authenticated;
grant select, insert, update, delete on public.exchange_rates to authenticated;
create policy admin_select on public.exchange_rates for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.exchange_rates for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.exchange_rates for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.exchange_rates for delete to authenticated using ((select private.is_content_admin()));
alter table public.exchange_rate_history enable row level security;
revoke all on public.exchange_rate_history from public, anon, authenticated;
grant select, insert, update, delete on public.exchange_rate_history to authenticated;
create policy admin_select on public.exchange_rate_history for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.exchange_rate_history for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.exchange_rate_history for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.exchange_rate_history for delete to authenticated using ((select private.is_content_admin()));
alter table public.services enable row level security;
revoke all on public.services from public, anon, authenticated;
grant select, insert, update, delete on public.services to authenticated;
create policy admin_select on public.services for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.services for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.services for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.services for delete to authenticated using ((select private.is_content_admin()));
alter table public.commission_rules enable row level security;
revoke all on public.commission_rules from public, anon, authenticated;
grant select, insert, update, delete on public.commission_rules to authenticated;
create policy admin_select on public.commission_rules for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.commission_rules for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.commission_rules for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.commission_rules for delete to authenticated using ((select private.is_content_admin()));
alter table public.bank_accounts enable row level security;
revoke all on public.bank_accounts from public, anon, authenticated;
grant select, insert, update, delete on public.bank_accounts to authenticated;
create policy admin_select on public.bank_accounts for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.bank_accounts for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.bank_accounts for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.bank_accounts for delete to authenticated using ((select private.is_content_admin()));
alter table public.gift_cards enable row level security;
revoke all on public.gift_cards from public, anon, authenticated;
grant select, insert, update, delete on public.gift_cards to authenticated;
create policy admin_select on public.gift_cards for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.gift_cards for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.gift_cards for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.gift_cards for delete to authenticated using ((select private.is_content_admin()));
alter table public.gift_card_denominations enable row level security;
revoke all on public.gift_card_denominations from public, anon, authenticated;
grant select, insert, update, delete on public.gift_card_denominations to authenticated;
create policy admin_select on public.gift_card_denominations for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.gift_card_denominations for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.gift_card_denominations for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.gift_card_denominations for delete to authenticated using ((select private.is_content_admin()));
alter table public.site_settings enable row level security;
revoke all on public.site_settings from public, anon, authenticated;
grant select, insert, update, delete on public.site_settings to authenticated;
create policy admin_select on public.site_settings for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.site_settings for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.site_settings for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.site_settings for delete to authenticated using ((select private.is_content_admin()));
alter table public.social_links enable row level security;
revoke all on public.social_links from public, anon, authenticated;
grant select, insert, update, delete on public.social_links to authenticated;
create policy admin_select on public.social_links for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.social_links for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.social_links for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.social_links for delete to authenticated using ((select private.is_content_admin()));
alter table public.trust_indicators enable row level security;
revoke all on public.trust_indicators from public, anon, authenticated;
grant select, insert, update, delete on public.trust_indicators to authenticated;
create policy admin_select on public.trust_indicators for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.trust_indicators for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.trust_indicators for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.trust_indicators for delete to authenticated using ((select private.is_content_admin()));
alter table public.announcements enable row level security;
revoke all on public.announcements from public, anon, authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
create policy admin_select on public.announcements for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.announcements for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.announcements for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.announcements for delete to authenticated using ((select private.is_content_admin()));
alter table public.gallery_items enable row level security;
revoke all on public.gallery_items from public, anon, authenticated;
grant select, insert, update, delete on public.gallery_items to authenticated;
create policy admin_select on public.gallery_items for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.gallery_items for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.gallery_items for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.gallery_items for delete to authenticated using ((select private.is_content_admin()));
alter table public.news_events enable row level security;
revoke all on public.news_events from public, anon, authenticated;
grant select, insert, update, delete on public.news_events to authenticated;
create policy admin_select on public.news_events for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.news_events for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.news_events for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.news_events for delete to authenticated using ((select private.is_content_admin()));
alter table public.testimonials enable row level security;
revoke all on public.testimonials from public, anon, authenticated;
grant select, insert, update, delete on public.testimonials to authenticated;
create policy admin_select on public.testimonials for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.testimonials for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.testimonials for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.testimonials for delete to authenticated using ((select private.is_content_admin()));
alter table public.gift_card_pricing enable row level security;
revoke all on public.gift_card_pricing from public, anon, authenticated;
grant select, insert, update, delete on public.gift_card_pricing to authenticated;
create policy admin_select on public.gift_card_pricing for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.gift_card_pricing for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.gift_card_pricing for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.gift_card_pricing for delete to authenticated using ((select private.is_content_admin()));
alter table public.cms_state enable row level security;
revoke all on public.cms_state from public, anon, authenticated;
grant select, insert, update, delete on public.cms_state to authenticated;
create policy admin_select on public.cms_state for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.cms_state for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.cms_state for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.cms_state for delete to authenticated using ((select private.is_content_admin()));
alter table public.activity_logs enable row level security;
revoke all on public.activity_logs from public, anon, authenticated;
grant select, insert, update, delete on public.activity_logs to authenticated;
create policy admin_select on public.activity_logs for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.activity_logs for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.activity_logs for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.activity_logs for delete to authenticated using ((select private.is_content_admin()));
alter table public.contacts enable row level security;
revoke all on public.contacts from public, anon, authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
create policy admin_select on public.contacts for select to authenticated using ((select private.is_content_admin()));
create policy admin_insert on public.contacts for insert to authenticated with check ((select private.is_content_admin()));
create policy admin_update on public.contacts for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));
create policy admin_delete on public.contacts for delete to authenticated using ((select private.is_content_admin()));
revoke update, delete on public.activity_logs from authenticated;
grant usage, select on sequence public.activity_logs_id_seq, public.contacts_id_seq to authenticated;
grant select on public.countries to anon;
create policy public_select on public.countries for select to anon, authenticated using (is_active);
grant select on public.currencies to anon;
create policy public_select on public.currencies for select to anon, authenticated using (is_active);
grant select on public.exchange_rates to anon;
create policy public_select on public.exchange_rates for select to anon, authenticated using (is_active and exists(select 1 from public.currencies c where c.id=currency_id and c.is_active));
grant select on public.services to anon;
create policy public_select on public.services for select to anon, authenticated using (is_active);
grant select on public.commission_rules to anon;
create policy public_select on public.commission_rules for select to anon, authenticated using (is_active and exists(select 1 from public.services s where s.id=service_id and s.is_active));
grant select on public.bank_accounts to anon;
create policy public_select on public.bank_accounts for select to anon, authenticated using (is_active and exists(select 1 from public.countries c where c.id=country_id and c.is_active) and exists(select 1 from public.currencies c where c.id=currency_id and c.is_active));
grant select on public.gift_cards to anon;
create policy public_select on public.gift_cards for select to anon, authenticated using (status <> 'HIDDEN');
grant select on public.gift_card_denominations to anon;
create policy public_select on public.gift_card_denominations for select to anon, authenticated using (exists(select 1 from public.gift_cards g where g.id=gift_card_id and g.status <> 'HIDDEN'));
grant select on public.site_settings to anon;
create policy public_select on public.site_settings for select to anon, authenticated using (is_public and setting_key not in ('gift_card_rate_10_to_100','gift_card_rate_above_100'));
grant select on public.social_links to anon;
create policy public_select on public.social_links for select to anon, authenticated using (is_active);
grant select on public.trust_indicators to anon;
create policy public_select on public.trust_indicators for select to anon, authenticated using (is_active);
grant select on public.announcements to anon;
create policy public_select on public.announcements for select to anon, authenticated using (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
grant select on public.gallery_items to anon;
create policy public_select on public.gallery_items for select to anon, authenticated using (is_active);
grant select on public.news_events to anon;
create policy public_select on public.news_events for select to anon, authenticated using (is_published);
grant select on public.testimonials to anon;
create policy public_select on public.testimonials for select to anon, authenticated using (is_active);
create unique index countries_natural_key on public.countries (lower(slug));
create unique index currencies_natural_key on public.currencies (lower(symbol));
create unique index gift_cards_natural_key on public.gift_cards (lower(slug));
create unique index site_settings_natural_key on public.site_settings (lower(setting_key));
create unique index bank_accounts_natural_key on public.bank_accounts (country_id, lower(slug));
create unique index exchange_rates_natural_key on public.exchange_rates (currency_id);
create unique index gift_card_denominations_natural_key on public.gift_card_denominations (gift_card_id, face_value, currency);
alter table public.exchange_rates add constraint exchange_rates_currency_id_fk foreign key (currency_id) references public.currencies(id) deferrable initially deferred;
create index exchange_rates_currency_id_idx on public.exchange_rates(currency_id);
alter table public.exchange_rate_history add constraint exchange_rate_history_currency_id_fk foreign key (currency_id) references public.currencies(id) deferrable initially deferred;
create index exchange_rate_history_currency_id_idx on public.exchange_rate_history(currency_id);
alter table public.services add constraint services_calculator_currency_id_fk foreign key (calculator_currency_id) references public.currencies(id) deferrable initially deferred;
create index services_calculator_currency_id_idx on public.services(calculator_currency_id);
alter table public.commission_rules add constraint commission_rules_service_id_fk foreign key (service_id) references public.services(id) deferrable initially deferred;
create index commission_rules_service_id_idx on public.commission_rules(service_id);
alter table public.bank_accounts add constraint bank_accounts_country_id_fk foreign key (country_id) references public.countries(id) deferrable initially deferred;
create index bank_accounts_country_id_idx on public.bank_accounts(country_id);
alter table public.bank_accounts add constraint bank_accounts_currency_id_fk foreign key (currency_id) references public.currencies(id) deferrable initially deferred;
create index bank_accounts_currency_id_idx on public.bank_accounts(currency_id);
alter table public.gift_card_denominations add constraint gift_card_denominations_gift_card_id_fk foreign key (gift_card_id) references public.gift_cards(id) deferrable initially deferred;
create index gift_card_denominations_gift_card_id_idx on public.gift_card_denominations(gift_card_id);
alter table public.commission_rules add constraint valid_range check(maximum_amount >= minimum_amount);
alter table public.services add constraint calculator_currency_required check(not is_calculator_enabled or calculator_currency_id is not null);

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
  if not(t=any(array['countries','currencies','exchange_rates','exchange_rate_history','services','commission_rules','bank_accounts','gift_cards','gift_card_denominations','gift_card_pricing','site_settings','social_links','trust_indicators','announcements','gallery_items','news_events','testimonials','cms_state','activity_logs'])) then raise exception 'Invalid content table'; end if;
  expression := 'to_jsonb(r)';
  case t
  when 'exchange_rates' then expression := 'to_jsonb(r) || jsonb_build_object(''buy_price'', r.buy_price::text, ''sell_price'', r.sell_price::text, ''calculator_rate'', r.calculator_rate::text)';
  when 'exchange_rate_history' then expression := 'to_jsonb(r) || jsonb_build_object(''old_value'', r.old_value::text, ''new_value'', r.new_value::text)';
  when 'commission_rules' then expression := 'to_jsonb(r) || jsonb_build_object(''minimum_amount'', r.minimum_amount::text, ''maximum_amount'', r.maximum_amount::text, ''commission_value'', r.commission_value::text)';
  when 'gift_card_denominations' then expression := 'to_jsonb(r) || jsonb_build_object(''face_value'', r.face_value::text)';
  when 'gift_card_pricing' then expression := 'to_jsonb(r) || jsonb_build_object(''selling_price_lyd'', r.selling_price_lyd::text, ''manual_selling_price_lyd'', r.manual_selling_price_lyd::text, ''special_price_usd'', r.special_price_usd::text)';
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
create trigger content_changed after insert or update or delete on public.countries for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.currencies for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.exchange_rates for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.exchange_rate_history for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.services for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.commission_rules for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.bank_accounts for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.gift_cards for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.gift_card_denominations for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.gift_card_pricing for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.site_settings for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.social_links for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.trust_indicators for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.announcements for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.gallery_items for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.news_events for each row execute function private.content_changed();
create trigger content_changed after insert or update or delete on public.testimonials for each row execute function private.content_changed();

create function public.commit_content(p_expected text, p_changes jsonb, p_next_ids jsonb, p_operation uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
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
