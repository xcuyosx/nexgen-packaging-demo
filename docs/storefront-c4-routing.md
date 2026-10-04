# C4 — Not-found routes

Implemented locally; not deployed.

- [x] Unknown routes, products, and industries render a page-not-found message
  with product and contact recovery links and a noindex tag.
- [x] Hard-refresh checks passed for 55 existing routes: 40 products, five
  industries, and ten main pages including cart and account.
- [x] Three invalid paths retain their URLs and show the not-found page.
- [x] Recovery links work on desktop and at 375 px. Navigation restores the
  preceding robots policy. No runtime errors or broken images were observed.

Verification: local Chromium route checks in the task workspace,
`verify-assets.mjs routes`; TypeScript and lint checks.

The existing Vercel SPA rewrite is preserved. Unknown URLs still return HTTP
200 at the host; the rendered page is noindex. A server-side 404 is optional
in the brief and is not included in this patch.
