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

drop trigger if exists product_catalog_set_updated_at on public.product_catalog;

create trigger product_catalog_set_updated_at
before update on public.product_catalog
for each row
execute function public.set_updated_at();

alter table public.product_catalog enable row level security;

grant select, insert, update, delete on table public.product_catalog to authenticated;

drop policy if exists "Authenticated users can manage product catalog" on public.product_catalog;
create policy "Authenticated users can manage product catalog"
on public.product_catalog
for all
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);
