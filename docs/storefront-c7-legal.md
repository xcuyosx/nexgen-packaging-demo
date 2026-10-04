# C7 — Legal routes and footer

Implemented locally with the brief's permitted “Coming soon” placeholders.

- [x] Footer navigation includes Products, Industries, Capabilities, Contact,
  Privacy, and Terms on every route, with working phone and email links.
- [x] Privacy and Terms have separate titles, one h1, and noindex while pending.
- [x] A shared LegalPage renders content files as escaped text, never executable
  HTML. Pending documents are excluded from the sitemap. Setting published=true
  after approval adds the corresponding URL; the build rejects empty documents.
- [x] Production-preview browser checks passed on 57 routes, including legal
  placeholders and all catalog pages, plus three not-found routes.
- [ ] TODO(bradley): Provide the approved Privacy Policy and Terms of Use / Quote
  Terms for src/content/privacy.md and src/content/terms.md. No legal text drafted.
- [ ] TODO(bradley): Confirm the five locations and full public contact address.
  src/businessContact.ts contains only the existing confirmed Bridgeton, MO entry.

The placeholder pages may be previewed but are not substitutes for legal review.
No deployment occurred. Final legal content and the complete location list still
block launch acceptance for this item.
