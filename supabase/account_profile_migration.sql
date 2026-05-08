alter table public.leads
add column if not exists account_profile jsonb not null default '{}'::jsonb;
