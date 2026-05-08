alter table public.leads
add column if not exists activity_log jsonb not null default '[]'::jsonb;
