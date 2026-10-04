begin;
set local lock_timeout = '10s';

-- No historical backfill and no hosted scheduler or outbound network calls.
-- The worker stays disabled unless QUOTE_EMAIL_ENABLED is explicitly true.
create schema if not exists private;

create table public.quote_notification_jobs (
  request_id uuid not null references public.customer_quote_requests(id) on delete cascade,
  kind text not null check (kind in ('sales', 'customer')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  verified_email text,
  created_at timestamptz not null default clock_timestamp(),
  prepared_mail jsonb check (prepared_mail is null or jsonb_typeof(prepared_mail) = 'object'),
  first_attempt_at timestamptz,
  accepted_at timestamptz,
  provider_id text,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default clock_timestamp(),
  claim_id uuid,
  claim_until timestamptz,
  stopped_reason text,
  primary key (request_id, kind)
);
alter table public.quote_notification_jobs enable row level security;
revoke all on public.quote_notification_jobs from public, anon, authenticated;
grant select, update on public.quote_notification_jobs to service_role;
create index quote_notification_jobs_pending on public.quote_notification_jobs(next_attempt_at, created_at)
  where accepted_at is null and stopped_reason is null;

create table private.storefront_quote_rate (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 20),
  primary key (user_id, window_start)
);
alter table private.storefront_quote_rate enable row level security;
revoke all on private.storefront_quote_rate from public, anon, authenticated, service_role;
create index storefront_quote_rate_expiry on private.storefront_quote_rate(window_start);

-- A narrow trigger is privileged only to capture the verified Auth address and
-- insert service-only jobs. It accepts no caller-supplied recipient or mail body.
create function private.queue_storefront_quote_notifications()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
declare recipient text; used integer;
begin
  delete from private.storefront_quote_rate where window_start < clock_timestamp() - interval '2 days';
  insert into private.storefront_quote_rate(user_id, window_start, attempts)
    values(new.user_id, date_trunc('hour', clock_timestamp()), 1)
    on conflict(user_id, window_start) do update set attempts = private.storefront_quote_rate.attempts + 1
    returning attempts into used;
  -- The check constraint caps all concurrent submissions at 20/user/hour.
  -- Exceeding it rolls back the request, CRM quote and notification jobs together.
  select u.email into recipient from auth.users u
    where u.id = new.user_id and u.email_confirmed_at is not null;
  insert into public.quote_notification_jobs(request_id, kind, snapshot, verified_email, stopped_reason)
  select new.id, k, jsonb_build_object(
    'id',new.id,'user_id',new.user_id,'request_number',new.request_number,
    'contact',new.contact_snapshot,'billing',new.billing_snapshot,'shipping',new.shipping_snapshot,
    'purchase_order',new.purchase_order,'notes',new.notes,'lines',new.lines),
    recipient, case when k = 'customer' and recipient is null then 'unverified_recipient' end
  from unnest(array['sales','customer']) as k;
  return new;
end;
$$;
revoke all on function private.queue_storefront_quote_notifications() from public, anon, authenticated, service_role;
create trigger customer_quote_request_queue_notifications
  after insert on public.customer_quote_requests
  for each row execute function private.queue_storefront_quote_notifications();

create function public.claim_quote_notification(p_claim_id uuid)
returns setof public.quote_notification_jobs
language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if p_claim_id is null then raise exception 'Missing claim identity'; end if;
  -- Resend retains idempotency keys for 24 hours. Stop ambiguous delivery
  -- before that expires; an operator must reconcile provider logs before re-send.
  update public.quote_notification_jobs set stopped_reason = 'retry_window_expired', claim_id = null, claim_until = null
    where accepted_at is null and stopped_reason is null
      and first_attempt_at <= clock_timestamp() - interval '23 hours'
      and (claim_until is null or claim_until < clock_timestamp());
  return query
  with candidate as (
    select request_id, kind from public.quote_notification_jobs
    where accepted_at is null and stopped_reason is null
      and next_attempt_at <= clock_timestamp()
      and (claim_until is null or claim_until < clock_timestamp())
    order by next_attempt_at, created_at, kind
    for update skip locked limit 1
  ) update public.quote_notification_jobs j
    set claim_id = p_claim_id, claim_until = clock_timestamp() + interval '2 minutes', attempts = attempts + 1
    from candidate c where j.request_id = c.request_id and j.kind = c.kind returning j.*;
end;
$$;
revoke all on function public.claim_quote_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_quote_notification(uuid) to service_role;
commit;
