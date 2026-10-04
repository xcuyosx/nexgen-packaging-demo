# C12 — Read-only Supabase and Vercel launch review

Checked 2026-10-04. No settings, permissions, customer records, or hosted schema
were changed. The storefront and CRM use Supabase project fbhernygpoapgilshsdq.

| Requirement | Observed status | Remaining action |
| --- | --- | --- |
| Custom SMTP | **Blocked.** Dashboard explicitly reports the built-in email service. | Configure an approved sender after DNS access/verification. Confirm the Auth sender separately from inquiry mail. |
| Auth Site URL | **Needs review.** Default is https://nexgen-packaging-crm-xcuyosxs-projects.vercel.app/. | Coordinate the shared CRM/storefront fallback before launch; do not blindly replace the CRM URL. |
| Redirect URLs | Storefront staging `https://storefront-staging.vercel.app/**` is allowed, alongside CRM URLs and localhost:3002. | Approve the final public origin. Current local 127.0.0.1:5173 is not in the inspected list; real local confirmation/reset flows are not verified. |
| Auth email templates | **Blocked.** Confirm signup, reset password, and magic link use default unbranded text and ConfirmationURL. | Supply approved NexGen copy; test final redirects and delivery after SMTP setup. |
| Public table RLS | **Pass for enabled state:** all 34 tables have RLS. No public views and no unconditional `true` policies found. | Two-customer authenticated isolation tests remain necessary before sign-off. Enabled RLS alone is not proof of complete authorization. |
| Customer policies | Account/order/request reads are scoped to the current user or employee. Quote inserts require the current user's linked lead. CRM quote/line access requires employee authorization. | Verify with distinct synthetic customer sessions in an isolated environment. |
| Anonymous access | **Passed read checks.** Eight customer/quote/profile endpoints returned either no rows or permission denial. Artwork listing returned no objects. | This was read-only; no hosted insert/update/delete probes were run. C1 inquiries table/function is not deployed yet. |
| Artwork storage | **Pass for configuration:** customer-quote-artwork is private, 10 MiB limit, explicit MIME allow-list. | C10 still needs email-safe signed download links and delivered-email verification. |
| Environment separation | **Shared live database.** Storefront staging is not an isolated data environment. | Keep destructive and seeded write tests local; do not submit test requests to this shared project without a deliberate test plan. |
| Vercel production env | VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY exist. Resend settings exist for production and preview. | New source defaults keep the current staging hostname noindex. Final VITE_SITE_URL / launch indexing settings remain pending. |
| Vercel preview env | Supabase public configuration is currently listed only for Production. | Configure preview values before deploying this branch; C3 intentionally rejects missing configuration. |

## Storage policies inspected

- Authenticated customers upload only beneath their user/request UUIDs, with
  allow-listed filename extensions and an existing linked account.
- Customers read/delete their own unsubmitted artwork. Submitted files cannot
  be removed through that customer cleanup policy.
- Employees can retrieve quote artwork through authenticated storage operations.
- No anonymous artwork policy was present.

## Security advisor follow-up

The advisor reported nine INFO entries for RLS tables without direct policies;
these include service-only operations and are not permission to open access.
It also flagged three anonymously callable and 15 authenticated SECURITY DEFINER
functions. Public catalog RPCs are intentionally public, but each remaining
function needs a guard review; do not blanket-revoke shared CRM RPCs.

- [Review public SECURITY DEFINER execution](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Review signed-in SECURITY DEFINER execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [OTP expiry exceeds one hour](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

Evidence: dashboard template/URL pages, read-only pg_tables/pg_policies and storage
configuration queries, Supabase security advisors, Vercel environment listing,
and workspace `check-anon-access.mjs`. The latter loads the public URL/key from
the ignored environment file, reports only statuses/counts, and never logs keys
or customer records. Results are saved under outputs/storefront-security.
