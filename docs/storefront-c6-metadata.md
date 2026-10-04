# C6 — Page metadata and quote-request wording

Implemented and verified locally; not deployed.

- [x] All 55 main, product, and industry routes have distinct titles and
  descriptions between 70 and 160 characters.
- [x] Canonical, Open Graph, and Twitter tags update on navigation. Canonicals
  omit search parameters and fragments. Static home defaults exist in index.html.
- [x] Each checked route has exactly one h1. Product headings remain accessible
  on desktop and mobile; visual duplicates are excluded from the accessibility tree.
- [x] Cart, account, and invalid routes are noindex. Moving from a private or
  invalid route to a public page restores the correct public indexing policy.
- [x] Desktop and 375 px screenshots reviewed; no overflow, broken images,
  runtime errors, or changed home hero appearance.

Bradley resolved D2: use quote-request wording. Updated the browser title,
contact heading and standard-product inquiry label, and the account action that
starts a new request. Existing order-history records and purchase-order fields
retain their meaning. The unfinished C1 form includes the same copy updates.

Checks: TypeScript, ESLint, `node scripts/check-search-build.mjs`, and the local
production-browser verifier `verify-metadata.mjs` in the task workspace. The
browser run uses synthetic configuration and a mocked backend, without customer
record changes or email sending.

TODO(bradley): Replace public/og-default.png with the approved 1200×630 social
image. The temporary image uses the existing logo and quote-request wording.
Static previews share the home defaults; per-route crawler prerendering remains
outside this brief's scope. Final public hostname remains open under D4.
