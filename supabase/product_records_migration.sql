alter table public.leads
add column if not exists product_records jsonb not null default '[]'::jsonb;
