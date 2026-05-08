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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

alter table public.leads enable row level security;

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
