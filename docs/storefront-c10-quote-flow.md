# C10 Quote notifications and retry verification

Implemented and verified locally on 2026-10-04; hosted acceptance is pending.
Sign-in remains required. Sales recipient and sender: orders@nexgenpac.com.
No hosted migration, deployment, scheduler, data write or real email was performed.
QUOTE_EMAIL_ENABLED defaults to disabled.

## Submission

The existing customer lookup, request table, CRM creation triggers and private
artwork bucket remain the integration points. A synchronous busy guard prevents
duplicate form events. A stable UUID/reference identifies retries; a digest of
request fields and artwork bytes detects changed inputs. Only the digest, ID and
reference are saved in localStorage. Receipt confirmation clears that record.

Before inserting, the client checks for its earlier request through customer RLS.
It verifies returned ID/reference instead of trusting an empty 2xx response. After
an ambiguous insert it attempts recovery; failure preserves the cart and retry ID.
Reattaching identical artwork reuses its immutable path. Check quote history before
changing a request after an ambiguous failure.

Uploads are retained after uncertain failures because an insert may have committed.
Existing policies protect submitted artwork. Abandoned files need a separately
approved retention/cleanup process; no file deletion job is installed here.

## Durable delivery

Migration 20261004052321_storefront_quote_notifications.sql adds two service-only
jobs in the same transaction as each new request. It does not backfill old requests
or alter existing CRM creation triggers. Customer recipients come from verified
Auth email, never the editable contact field. Unverified recipients are blocked.

A private rate table permits 20 requests/user/clock hour. Concurrent over-limit
inserts roll back the request, CRM trigger writes and jobs. Customer and anonymous
roles cannot access jobs, rates or the claim RPC. The trigger has a fixed search
path and no publicly executable function privilege.

The scheduler-only quote-notifications function requires a server-held secret of
at least 32 characters. It claims at most two jobs per invocation using atomic
SKIP LOCKED leases and bounded network calls. It is never called by the browser.

Sales messages contain the reference, all items/specifications/print colors,
contact/billing/receiving information, notes and 24-hour signed artwork downloads.
These are bearer links: anyone given a link can use it until expiry. Only sales
receives them; staff retain authenticated CRM access after expiry. Customer receipts
contain a reference and item summary, not an order or delivery promise.

The exact message and links are saved before contacting Resend. A stable key per
request/recipient and fixed JSON serialization make retries identical even after
PostgreSQL jsonb reorders fields. Partial failures do not resend accepted jobs.
Provider acceptance is not proof of inbox delivery. Retries stop after 23 hours
from preparation, ahead of Resend's 24-hour idempotency expiry, or 20 failed attempts.
An operator must reconcile provider logs before resending a stopped/ambiguous job.

## Verification

- 43 regression tests, frontend/backend TypeScript and ESLint pass.
- 34 assertions against fresh native PostgreSQL, Chromium and local HTTP adapters
  pass: service-only access, tenant isolation, concurrent job claims and rate
  limits, rollback, unverified recipients, double form events, lost responses,
  retained cart, recovered receipt, partial email failure and durable exact replay.
- Signed artwork returned the uploaded bytes; tampered/expired tokens and anonymous
  reads were denied by the local Storage adapter.
- One browser request, one fixture CRM quote/line, and two distinct simulated emails
  from three provider attempts. No browser runtime or local adapter errors.
- Actual new migration and application/worker adapters were exercised. Auth,
  Storage gateway, email provider and the pre-existing CRM bridge are synthetic
  fixtures. Hosted Supabase and real inboxes have not been tested end-to-end.
- Existing production build guards still reject missing configuration and exclude
  demo data. No server mailer is imported into the browser bundle.

Run npm.cmd test. For integration, set QUOTE_TEST_DATABASE_URL to a new local
PostgreSQL database named storefront_quote_test_<digits>, set a Playwright browser
path if needed, and run npm.cmd run test:quotes:integration. Remote DB URLs are
rejected. HTTP ports are 54330 and 5187. The chat workspace contains the native
PostgreSQL runner and outputs/storefront-quote-notifications/result.json.

## Hosted rollout still required

1. Resolve sender verification; approve receipt copy and an actual test mailbox.
2. Review this migration against the current shared schema/recovery point and
   review the 20/hour limit with operations before applying. Verify actual CRM
   linkage, RLS and private artwork signing in an approved isolated hosted test.
3. Deploy the function disabled. Server settings: SUPABASE_URL,
   SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, QUOTE_WORKER_SECRET and
   QUOTE_EMAIL_ENABLED=false. Never expose them in VITE_ settings.
4. Configure a server-held recurring POST to the protected function, using secure
   secret storage such as Vault. No schedule is installed. Durable jobs survive
   browser closure but require that worker schedule to run.
5. Review any backlog accumulated while disabled before enabling mail. Monitor
   pending age, stopped_reason and provider outcomes. Do not reset dedupe IDs or
   timestamps to force an ambiguous message through.
6. Enable only after sender verification and coordinated release approval; verify
   actual inboxes and signed artwork access. Deploy the client retry change.
   QUOTE_EMAIL_ENABLED=false stops sending without deleting quote records.

References: [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)
and [Supabase storage access](https://supabase.com/docs/guides/storage/security/access-control).
