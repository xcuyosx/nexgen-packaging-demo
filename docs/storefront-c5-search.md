# C5 — Search assets and staging protection

Prepared locally; hosted acceptance awaits deployment.

- [x] Build emits robots.txt as plain text and sitemap.xml as XML. Local preview
  HTTP responses have the correct content types.
- [x] Sitemap derives 53 unique public URLs from the catalog and industry data:
  eight main pages, 40 product families, and five industries. Cart/account excluded.
- [x] Staging and preview builds emit a static noindex,nofollow meta tag.
- [x] A production build on an approved public origin, with VITE_NOINDEX unset,
  omits the global noindex tag.
- [ ] Verify the same responses on Vercel after deployment.

`node scripts/check-search-build.mjs` checks all three deployment configurations.
The current storefront-staging.vercel.app hostname always stays noindex, even
though Vercel calls its primary deployment “production.” The VERCEL_ENV preview
setting also forces noindex. No hosting settings were changed.

TODO(bradley): Confirm the final public origin. Until then VITE_SITE_URL defaults
to the existing Vercel hostname. At launch, set it to the approved HTTPS origin
and unset VITE_NOINDEX. Legal URLs will be included once approved content exists.
