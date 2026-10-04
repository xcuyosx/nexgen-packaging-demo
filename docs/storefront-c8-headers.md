# C8 — Security headers and browser caching

Prepared locally; hosted rollout and acceptance remain pending.

- [x] Vercel configuration includes nosniff, DENY framing, strict-origin referrer
  policy, and disabled camera/microphone/geolocation permissions.
- [x] CSP starts in Report-Only, as requested. Wix is excluded. Current Fontshare
  and Supabase origins are retained; inline styles and artwork image previews work.
- [x] Hashed assets cache for one year as immutable; product images for one week.
  Existing PDF redirect and SPA rewrite are preserved.
- [x] Isolated local preview enforced the proposed CSP on 58 routes, synthetic
  sign-in, SVG image preview, and add-to-cart: zero policy violations/runtime errors.
- [x] Separate browser context confirmed a repeated hashed-asset fetch came from
  cache without a network transfer.
- [ ] Deploy Report-Only to staging; verify hosted response headers and real
  sign-in, artwork upload, and inquiry/quote API behavior.
- [ ] After hosted checks pass, switch to Content-Security-Policy and verify again.

Verifier: work/storefront-assets/verify-security.mjs in the task workspace.
Backend responses were mocked; no real sign-in, email sending, storage upload, or
customer mutation occurred. Local checks do not prove Vercel header behavior.
