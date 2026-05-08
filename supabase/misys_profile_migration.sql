alter table public.leads
add column if not exists misys_profile jsonb not null default '{}'::jsonb;
