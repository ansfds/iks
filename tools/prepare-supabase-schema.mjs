// Generates a PostgreSQL schema from the reviewed application models, not MySQL DDL.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
await mkdir('.cache/content-tools', { recursive: true });
await build({ entryPoints: ['server/cms/models.ts'], outfile: '.cache/content-tools/models.mjs', bundle: true, platform: 'node', format: 'esm' });
const { collectionsSchema } = await import(pathToFileURL(path.resolve('.cache/content-tools/models.mjs')).href);
const snake = x => x.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
const decimals = new Set(['buyPrice','sellPrice','calculatorRate','oldValue','newValue','minimumAmount','maximumAmount','commissionValue','faceValue','sellingPriceLyd','manualSellingPriceLyd','specialPriceUsd']);
const priceKeys = ['sellingPriceLyd','manualSellingPriceLyd','specialPriceUsd'];
const manifest = {};
let sql = `-- PostgreSQL: reviewed content model; Supabase Auth replaces legacy user/session tables.\n`;
let drizzle = `// PostgreSQL reference schema. Runtime uses Supabase Data API and transactional RPCs.\nimport { pgTable, bigint, integer, text, boolean, timestamp, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';\n\n`;
for (const [name, array] of Object.entries(collectionsSchema.shape)) {
  const table = snake(name), fields = {};
  const cols = [], ds = [];
  for (const [key, field] of Object.entries(array.element.shape)) {
    if (name === 'giftCardDenominations' && priceKeys.includes(key)) continue;
    let base = field, nullable = false;
    while (base.def.innerType) { if (base.def.type === 'nullable') nullable = true; base = base.def.innerType; }
    const col = snake(key);
    const parsedDefault = field.safeParse(undefined);
    let type = 'text', d = `text('${col}')`;
    if (decimals.has(key)) { type = 'numeric'; d = `numeric('${col}')`; }
    else if (base.def.type === 'date') { type = 'timestamptz'; d = `timestamp('${col}', { withTimezone: true, mode: 'date' })`; }
    else if (base.def.type === 'boolean') { type = 'boolean'; d = `boolean('${col}')`; }
    else if (base.def.type === 'number') { type = key === 'sortOrder' || key === 'rating' ? 'integer' : 'bigint'; d = type === 'bigint' ? `bigint('${col}', { mode: 'number' })` : `integer('${col}')`; }
    fields[col] = { key, type, nullable };
    let def = '';
    if (key === 'id') { def = ' primary key check (id > 0 and id <= 9007199254740991)'; d += '.primaryKey()'; }
    else {
      if (!nullable) { def += ' not null'; d += '.notNull()'; }
      if (parsedDefault.success && parsedDefault.data !== null && parsedDefault.data !== undefined) {
        if (base.def.type === 'date') { def += ' default now()'; d += '.defaultNow()'; }
        else { const v = parsedDefault.data; def += ' default ' + (typeof v === 'string' ? "'" + v.replaceAll("'", "''") + "'" : String(v)); d += `.default(${JSON.stringify(v)})`; }
      }
      if (base.def.type === 'enum') def += ` check (${col} in (${Object.values(base.def.entries).map(v => "'" + v + "'").join(', ')}))`;
      if (type === 'numeric') def += ` check (${col} >= 0 and ${col} <= 999999999999)`;
      if (type === 'text' && base.maxLength) def += ` check (length(${col}) <= ${base.maxLength})`;
    }
    cols.push(`  ${col} ${type}${def}`); ds.push(`  ${key}: ${d}`);
  }
  manifest[name] = { table, fields };
  sql += `create table public.${table} (\n${cols.join(',\n')}\n);\nalter table public.${table} enable row level security;\n\n`;
  drizzle += `export const ${name} = pgTable('${table}', {\n${ds.join(',\n')}\n});\n\n`;
}
const source = JSON.parse(await readFile('content/site.json', 'utf8'));
const extra = `
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
insert into public.cms_state(id,next_ids) values (1, '${JSON.stringify(source.nextIds)}'::jsonb);
create table public.activity_logs (id bigint generated by default as identity primary key, user_id uuid references auth.users(id), legacy_user_id bigint, action text not null, entity_type text not null, entity_id bigint, metadata text not null default '', created_at timestamptz not null default now());
create index activity_logs_created_idx on public.activity_logs(created_at desc);
create index activity_logs_user_idx on public.activity_logs(user_id);
create table public.contacts (id bigint generated by default as identity primary key, student_name text not null, parent_name text not null, email text not null, phone text, grade text, message text not null, language text not null default 'ar' check(language in ('ar','en')), created_at timestamptz not null default now(), is_read boolean not null default false);
`;
sql += extra;
const tables = [...Object.values(manifest).map(x => x.table), 'gift_card_pricing', 'cms_state', 'activity_logs', 'contacts'];
for (const table of tables) {
  sql += `alter table public.${table} enable row level security;\nrevoke all on public.${table} from public, anon, authenticated;\ngrant select, insert, update, delete on public.${table} to authenticated;\ncreate policy admin_select on public.${table} for select to authenticated using ((select private.is_content_admin()));\ncreate policy admin_insert on public.${table} for insert to authenticated with check ((select private.is_content_admin()));\ncreate policy admin_update on public.${table} for update to authenticated using ((select private.is_content_admin())) with check ((select private.is_content_admin()));\ncreate policy admin_delete on public.${table} for delete to authenticated using ((select private.is_content_admin()));\n`;
}
// Logs are append-only. State is updated only by the admin transaction/triggers.
sql += `revoke update, delete on public.activity_logs from authenticated;\ngrant usage, select on sequence public.activity_logs_id_seq, public.contacts_id_seq to authenticated;\n`;
const publicConditions = {
 countries: 'is_active', currencies: 'is_active', exchange_rates: 'is_active and exists(select 1 from public.currencies c where c.id=currency_id and c.is_active)',
 services: 'is_active', commission_rules: 'is_active and exists(select 1 from public.services s where s.id=service_id and s.is_active)',
 bank_accounts: 'is_active and exists(select 1 from public.countries c where c.id=country_id and c.is_active) and exists(select 1 from public.currencies c where c.id=currency_id and c.is_active)',
 gift_cards: "status <> 'HIDDEN'", gift_card_denominations: "exists(select 1 from public.gift_cards g where g.id=gift_card_id and g.status <> 'HIDDEN')",
 site_settings: "is_public and setting_key not in ('gift_card_rate_10_to_100','gift_card_rate_above_100')",
 social_links: 'is_active', trust_indicators: 'is_active', announcements: 'is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())',
 gallery_items: 'is_active', news_events: 'is_published', testimonials: 'is_active',
};
// Application field names key/value/type/group map to explicit, reserved-word-safe PG columns.
for (const name of ['siteSettings']) {
  const obj = manifest[name];
  for (const [a,b] of [['key','setting_key'],['value','setting_value'],['type','setting_type'],['group','setting_group']]) {
    sql = sql.replace(/create table public\.site_settings \([\s\S]*?\n\);/, block => block.replace(new RegExp(`\\b${a} (text|boolean|integer|timestamptz|numeric)`, 'g'), `${b} $1`));
    // Rewrite column check references in this table only below.
    obj.fields[b] = obj.fields[a]; delete obj.fields[a];
    drizzle = drizzle.replace(`${a}: text('${a}')`, `${a}: text('${b}')`);
  }
}
// Repair setting-key checks within the CREATE TABLE body (other table fields stay untouched).
sql = sql.replace(/create table public\.site_settings \([\s\S]*?\n\);/, block => block.replace(/length\((key|value|type|group)\)/g, (_,k)=>`length(setting_${k})`).replace(/check \(type in/g, 'check (setting_type in'));
for (const [table, condition] of Object.entries(publicConditions)) sql += `grant select on public.${table} to anon;\ncreate policy public_select on public.${table} for select to anon, authenticated using (${condition});\n`;
const constraints = [
 ['countries','unique(lower(slug))'],
];
void constraints;
for (const [table, expr] of [['countries','lower(slug)'],['currencies','lower(symbol)'],['gift_cards','lower(slug)'],['site_settings','lower(setting_key)'],['bank_accounts','country_id, lower(slug)'],['exchange_rates','currency_id'],['gift_card_denominations','gift_card_id, face_value, currency']]) sql += `create unique index ${table}_natural_key on public.${table} (${expr});\n`;
for (const [table,col,parent] of [['exchange_rates','currency_id','currencies'],['exchange_rate_history','currency_id','currencies'],['services','calculator_currency_id','currencies'],['commission_rules','service_id','services'],['bank_accounts','country_id','countries'],['bank_accounts','currency_id','currencies'],['gift_card_denominations','gift_card_id','gift_cards']]) {
 sql += `alter table public.${table} add constraint ${table}_${col}_fk foreign key (${col}) references public.${parent}(id) deferrable initially deferred;\ncreate index ${table}_${col}_idx on public.${table}(${col});\n`;
}
sql += `alter table public.commission_rules add constraint valid_range check(maximum_amount >= minimum_amount);\nalter table public.services add constraint calculator_currency_required check(not is_calculator_enabled or calculator_currency_id is not null);\n`;
await writeFile('.cache/content-schema-base.sql', sql);
await writeFile('server/supabase/content-manifest.json', JSON.stringify(manifest,null,2)+'\n');
drizzle += `export const giftCardPricing = pgTable('gift_card_pricing', { id: bigint('id', {mode:'number'}).primaryKey().references(()=>giftCardDenominations.id,{onDelete:'cascade'}), sellingPriceLyd: numeric('selling_price_lyd'), manualSellingPriceLyd: numeric('manual_selling_price_lyd'), specialPriceUsd: numeric('special_price_usd') });\n`;
drizzle += `export const cmsState = pgTable('cms_state', { id: integer('id').primaryKey(), revision: bigint('revision',{mode:'number'}).notNull().default(1), nextIds: jsonb('next_ids').notNull(), lastOperation: text('last_operation').notNull().default(''), migrationVerified: boolean('migration_verified').notNull().default(false) });\n`;
drizzle += `export const activityLogs = pgTable('activity_logs', { id: bigint('id',{mode:'number'}).generatedByDefaultAsIdentity().primaryKey(), userId: uuid('user_id'), legacyUserId: bigint('legacy_user_id',{mode:'number'}), action: text('action').notNull(), entityType: text('entity_type').notNull(), entityId: bigint('entity_id',{mode:'number'}), metadata: text('metadata').notNull().default(''), createdAt: timestamp('created_at',{withTimezone:true}).defaultNow().notNull() });\n`;
drizzle += `export const contacts = pgTable('contacts', { id: bigint('id',{mode:'number'}).generatedByDefaultAsIdentity().primaryKey(), studentName:text('student_name').notNull(), parentName:text('parent_name').notNull(), email:text('email').notNull(),phone:text('phone'),grade:text('grade'),message:text('message').notNull(),language:text('language').notNull().default('ar'),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),isRead:boolean('is_read').default(false).notNull() });\n`;
await writeFile('db/schema.ts', drizzle);
console.log(JSON.stringify({tables, contentCollections:Object.keys(manifest).length}));
