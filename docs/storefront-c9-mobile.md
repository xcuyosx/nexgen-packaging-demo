# C9 — Mobile zoom and form controls

Implemented locally; physical iOS Safari confirmation remains pending.

- [x] Viewport permits pinch zoom; maximum-scale and user-scalable restrictions removed.
- [x] All input/select/textarea controls have a 16 px floor at widths up to 900 px
  and on coarse-pointer devices. A deliberate accessibility override prevents
  component-specific compact styles from making fields smaller.
- [x] Chromium checks at 375 and 768 px cover Contact, Account, signed-in Cart,
  Custom, and product selectors. Sign-in, registration, and password-reset forms
  also pass the font-size checks. No horizontal overflow was observed.
- [x] Contact mobile screenshot reviewed.
- [ ] Confirm focus and pinch zoom on a physical iPhone in Safari before launch.

Command: local workspace verifier `verify-security.mjs --mobile`. No production
data changes, real authentication, or email sending occurred. Desktop Chromium
checks do not establish physical iOS behavior.
