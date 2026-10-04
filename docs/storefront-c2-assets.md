# C2: local storefront images

The header, homepage, and account screens now use local brand assets. The
desktop hero is a 2400 × 1341 WebP derived from the original 5481 × 3063 photo.
The existing mobile composition is preserved in a 1024 × 1536 WebP.

## Asset sources

- `public/brand/logo.png`: original NexGen logo (1253 × 300), downloaded from
  `https://static.wixstatic.com/media/067fd2_442e8edbc68c491ea121fea22fc5f107~mv2.png`.
- `public/images/storefront-hero-original.jpg`: original photo, downloaded from
  `https://static.wixstatic.com/media/067fd2_0ee5edd567cf45428f5ca53176428944~mv2.jpg`.
- `public/images/storefront-hero.webp`: desktop delivery image, resized with
  Lanczos and encoded at WebP quality 88. The original is retained for future use.
- `public/hero/mobile-storefront-hero-v2.webp`: existing mobile JPEG converted at
  WebP quality 90, preserving the existing crop.

Both hero sizes load eagerly with high fetch priority and explicit dimensions.
The mobile image is about 112 KB, down from the existing 290 KB JPEG.

TODO(bradley): Supply the approved `public/brand/logo.svg`. Vite checks for it at
startup/build and uses `/brand/logo.svg` when present, otherwise `/brand/logo.png`.
Restart the development server or rebuild after adding it. No failed SVG request
is needed to discover the fallback.

The four extra Wix photos were only referenced by the legacy `productImages`
fallback map. All local preview SKUs already have local catalog image overrides;
the public storefront catalog returned no additional rows during the read-only
check on 2026-10-03. None of those photos rendered in the current site, so the
unused mapping was removed and the extra photos were not downloaded. Unmatched
rows retain the existing curated-image fallback.

## Acceptance

- [x] Production output contains no `wixstatic` references.
- [x] Browser checks cover all 40 product routes, all five industry routes, and
  the ten primary routes, with zero Wix image requests.
- [x] Before/after screenshots preserve the existing desktop and 375 px mobile
  logo and hero presentation.
- [x] Build and lint pass.

Verification was local, using synthetic API responses. This change has not been
deployed. Email delivery (C1) remains pending domain credentials and verification.
