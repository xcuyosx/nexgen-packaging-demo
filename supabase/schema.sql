create extension if not exists pgcrypto;

create type public.lead_stage as enum (
  'New',
  'Qualified',
  'Sample Sent',
  'Quoted',
  'Won',
  'Nurture'
);

create type public.lead_priority as enum (
  'Hot',
  'Warm',
  'Cold'
);

create type public.sample_status as enum (
  'Not Requested',
  'Requested',
  'Packed',
  'Sent',
  'Delivered'
);

create type public.quote_status as enum (
  'Not Started',
  'Needs Pricing',
  'Drafting',
  'Sent',
  'Approved'
);

create type public.task_type as enum (
  'Call',
  'Email',
  'Send Samples',
  'Build Quote',
  'Check In'
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact text not null,
  title text,
  email text not null,
  phone text,
  city text,
  show_name text not null default 'Trade Show',
  packaging_needs text[] not null default '{}',
  annual_volume text not null default '',
  timeline text not null default '',
  notes text,
  stage public.lead_stage not null default 'New',
  priority public.lead_priority not null default 'Warm',
  owner text not null default 'Bradley',
  next_step text not null default 'Review booth notes and send first follow-up.',
  sample_status public.sample_status not null default 'Not Requested',
  quote_status public.quote_status not null default 'Not Started',
  task_type public.task_type not null default 'Email',
  task_due date not null default current_date,
  account_profile jsonb not null default '{}'::jsonb,
  product_records jsonb not null default '[]'::jsonb,
  misys_profile jsonb not null default '{}'::jsonb,
  activity_log jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_captured_at_idx on public.leads (captured_at desc);
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists leads_task_due_idx on public.leads (task_due);
create index if not exists leads_email_idx on public.leads (lower(email));

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  product_name text not null,
  category text not null default '',
  image_path text not null default '',
  material text not null default '',
  dimensions text not null default '',
  case_pack text not null default '',
  supplier text not null default '',
  supplier_sku text not null default '',
  cost numeric(12, 4) not null default 0,
  sell_price numeric(12, 4) not null default 0,
  margin numeric(6, 2) not null default 0,
  lead_time text not null default '',
  stock_type text not null default 'Custom',
  status text not null default 'Active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_catalog_category_idx on public.product_catalog (category);
create index if not exists product_catalog_status_idx on public.product_catalog (status);
create index if not exists product_catalog_supplier_idx on public.product_catalog (supplier);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

drop trigger if exists product_catalog_set_updated_at on public.product_catalog;

create trigger product_catalog_set_updated_at
before update on public.product_catalog
for each row
execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.product_catalog enable row level security;

grant select, insert, update, delete on table public.product_catalog to authenticated;

drop policy if exists "Public booth form can create leads" on public.leads;
create policy "Public booth form can create leads"
on public.leads
for insert
to anon
with check (true);

drop policy if exists "Authenticated users can manage leads" on public.leads;
create policy "Authenticated users can manage leads"
on public.leads
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage product catalog" on public.product_catalog;
create policy "Authenticated users can manage product catalog"
on public.product_catalog
for all
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

-- Temporary prototype-only policies:
-- The frontend can read and update leads with only the anon key if you uncomment
-- these while testing. Do not use these policies for a live trade show QR app.
--
-- create policy "Prototype anon read leads"
-- on public.leads
-- for select
-- to anon
-- using (true);
--
-- create policy "Prototype anon update leads"
-- on public.leads
-- for update
-- to anon
-- using (true)
-- with check (true);
