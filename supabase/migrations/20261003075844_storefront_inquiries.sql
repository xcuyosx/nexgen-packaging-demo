begin;
set local lock_timeout = '10s';

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_id uuid not null unique,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254 and email !~ '[[:cntrl:]]'),
  phone text check (char_length(phone) <= 40),
  company text not null check (char_length(btrim(company)) between 1 and 150),
  need text not null check (need in ('standard','sample','custom','reorder','sustainability')),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  source_page text not null default '/contact' check (source_page = '/contact'),
  status text not null default 'new',
  sales_notified_at timestamptz,
  visitor_notified_at timestamptz,
  delivery_claim uuid,
  delivery_claimed_at timestamptz
);
alter table public.inquiries enable row level security;
revoke all on public.inquiries from public, anon, authenticated;
grant select, insert, update on public.inquiries to service_role;

-- Only keyed hashes of client addresses are stored, never raw IP addresses.
create table public.inquiry_rate_limits (
  address_hash text not null check (address_hash ~ '^[a-f0-9]{64}$'),
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 6),
  primary key (address_hash, window_start)
);
create index inquiry_rate_limits_expiry on public.inquiry_rate_limits(window_start);
alter table public.inquiry_rate_limits enable row level security;
revoke all on public.inquiry_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.inquiry_rate_limits to service_role;

create function public.consume_inquiry_rate_limit(p_address_hash text)
returns boolean language plpgsql security invoker set search_path = pg_catalog as $$
declare current_window timestamptz := date_trunc('hour', clock_timestamp()); used integer;
begin
  if p_address_hash is null or p_address_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate-limit key'; end if;
  delete from public.inquiry_rate_limits where window_start < current_window - interval '2 days';
  insert into public.inquiry_rate_limits(address_hash, window_start, attempts)
    values(p_address_hash,current_window,1)
    on conflict(address_hash,window_start) do update
      set attempts=least(public.inquiry_rate_limits.attempts+1,6)
    returning attempts into used;
  return used <= 5;
end;
$$;
revoke all on function public.consume_inquiry_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text) to service_role;
commit;
