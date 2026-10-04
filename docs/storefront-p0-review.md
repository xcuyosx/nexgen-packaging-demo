# Storefront P0 review — 2026-10-04

Local branch: codex/storefront-p0. The storefront remains on its existing Vercel
URL. No push, deployment, DNS change, hosted migration, or customer-data mutation
occurred in this pass. C2–C12 each have a separate local commit; C1 remains an
unfinished, uncommitted draft. A commit does not mean hosted launch acceptance.

Bradley's decisions: use quote-request wording; keep sign-in required; inquiries
and customer confirmations use orders@nexgenpac.com; Resend Free; defer email
go-live until domain credentials are available.

| Item | Status | Result / remaining work |
| --- | --- | --- |
| C1 Contact delivery | **Blocked** | Server-backed local draft, validation, rate limits and idempotent Resend adapter tested. Wix/Resend domain compatibility, credentials, hosted deployment and inbox checks pending. |
| C2 Local images | **Done locally** | Local logo and WebP hero; all routes make zero Wix requests. Approved brand assets can replace the stopgaps. |
| C3 Demo mode | **Done locally** | Production build rejects missing Supabase config; demo account data and local bridge are removed from the build. |
| C4 Not found | **Done locally** | Unknown routes/products/industries show helpful noindex pages. Deep links pass. Host still uses SPA HTTP 200 fallback. |
| C5 Search assets | **Done locally; hosted check pending** | Generated sitemap has 53 public URLs. Staging/previews are noindex. Final public origin pending. |
| C6 Metadata/copy | **Done locally** | Distinct titles, 70–160 character descriptions, canonical/social tags, single h1 and quote-request wording. Temporary social image. |
| C7 Footer/legal | **Drafts ready for review** | Privacy, website/quote terms, conditional sales terms and credit application drafted at Bradley’s request. Company name confirmed; business details and counsel approval pending. Public legal routes remain unpublished. |
| C8 Security/cache | **Prepared; hosted rollout pending** | Local enforced CSP checks pass. Vercel config starts Report-Only; real hosted verification must precede enforcement. |
| C9 Mobile | **Done locally; iPhone check pending** | Zoom allowed; 16 px controls verified at 375 and 768 px. Physical iOS Safari remains untested. |
| C10 Quote flow | **Implemented and tested locally** | Durable jobs, safe retries, verified recipient and sales-only signed artwork links; 34 local database/browser assertions pass. Hosted deployment, worker schedule, sender verification and actual inbox checks remain. |
| C11 Home claims | **Blocked on approval** | Four existing tiles centralized unchanged. Counts, SQF wording/certificate/scope need approval. |
| C12 Production settings | **Reviewed; launch blocked** | All 34 public tables have RLS; anonymous read checks returned no customer rows/artwork. Shared database, SMTP, default Auth templates, redirects and security advisor follow-up remain. |

## Verification evidence

- TypeScript and ESLint passed; 43 unit/regression tests passed. Quote notifications also passed 34 local database/browser assertions with synthetic Auth, Storage, mail and CRM bridge fixtures.
- A separate archive of the committed HEAD also passed TypeScript, independently
  of the unfinished C1 draft. The four contact browser checks passed; the fallback
  details assertion was scoped to Contact after the footer gained matching links.
- Production guard: three missing-configuration combinations rejected; valid
  synthetic build excludes demo-account data and the local bridge URL.
- Search builds: staging and preview noindex; public production indexable;
  53 unique sitemap URLs and correct robots/XML MIME types.
- Browser: 57 normal routes with unique metadata and one accessible h1; three
  invalid paths; desktop and 375 px screenshots; zero broken images/runtime errors.
- Security: enforced local CSP on 58 routes, mocked sign-in, artwork and cart;
  zero violations; repeat hashed-asset fetch served from browser cache.
- Mobile: 375/768 px controls, signed-in cart, sign-in/signup/reset; oversized and
  unsupported files rejected; blob preview survives studio-to-cart navigation.
- C1 earlier isolated PostgreSQL run: 27 checks; hosted inquiries are not deployed.
- Read-only hosted checks: anonymous REST queries and private bucket listing;
  dashboard Auth/SMTP inspection; Supabase advisors and Vercel environment listing.

Commands: `node --test`, `node node_modules/typescript/bin/tsc -b`,
`node node_modules/eslint/bin/eslint.js .`, `node scripts/check-production-build.mjs`,
`node scripts/check-search-build.mjs`, and
`node node_modules/playwright/cli.js test --config playwright.inquiries.config.ts`.
Task-specific browser scripts and results are in the chat workspace under
work/storefront-assets and outputs/storefront-*; per-item reports have details.

## Files / decisions still needed

1. Domain/DNS access to finish the Wix-compatible Resend setup; authorized test
   mailbox and approved inquiry/quote/Auth email copy. No real email was sent.
2. Review docs/legal-drafts with counsel. Final Privacy Policy → src/content/privacy.md; Terms of Use and Quote
   Terms → src/content/terms.md. Publication flags remain false. Bradley requested drafting and confirmed NexGen Packaging Group as the name; unresolved details are marked.
3. Five verified locations/full address → src/businessContact.ts; approved counts
   and SQF wording/scope/certificate → src/businessStats.ts and supplied certificate.
4. Approved logo SVG → public/brand/logo.svg (existing PNG remains fallback);
   final white/color brand variants; approved hero may replace the local WebPs.
5. Approved 1200×630 share image → public/og-default.png (current logo/text placeholder).
6. Final public hostname (D4). Current staging hostname stays noindex. Preview
   deployments also need Supabase environment values before this branch can build.
7. Decide the secure payment-setup contact action (D6); it still uses the existing
   mail link. Claims evidence, terms of sale/credit documents if applicable, and a
   coordinated cutover/rollback plan remain launch dependencies from the brief.

P1 remains untouched. No claim of launch readiness is made while these gates remain.
