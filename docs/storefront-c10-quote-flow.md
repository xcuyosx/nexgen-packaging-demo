# C10 — Quote submission trace and remaining work

Partially verified; not accepted for launch. No hosted records were created.
Bradley confirmed D1 on 2026-10-04: keep sign-in required.

## Current path

1. CartPage calls App.sendQuoteRequest. It requires a customer session and checks
   missing artwork and unconfigured entrée components.
2. customerAccount.submitCustomerQuoteRequest reads the signed-in customer's
   customer_accounts.lead_id using the customer's access token.
3. Each artwork file uploads to the private customer-quote-artwork bucket under
   `<user UUID>/<request UUID>/<object UUID>.<extension>`, without upsert.
4. The browser inserts public.customer_quote_requests with contact, billing and
   shipping snapshots, PO/reference, notes, and JSON lines. The request number
   is WEB-<date>-<random suffix>.
5. Database trigger create_crm_quote_from_customer_request creates public.quotes
   with status Needs Pricing and public.quote_lines, then links quote_id back to
   the request. customer_quote_request_pipeline_on_link maintains pipeline linkage.
6. validate_customer_quote_request_input enforces snapshot/line bounds and server
   status/timestamps; validate_customer_quote_artwork checks request-scoped file
   ownership. Failed client inserts attempt cleanup of unsubmitted uploads.
7. The CRM fetches artwork through authenticated storage access. Email-safe signed
   download links are not part of the inspected request path.

## Verification

- [x] Read-only SQL confirms private artwork storage, 10 MiB server size limit,
  and allowed MIME types: PNG, JPEG, WebP, SVG, PDF, Illustrator, and PostScript.
- [x] Storage policies restrict paths to the authenticated customer/request.
  Customers may read/delete their unsubmitted files; employee access is required
  after submission. Anonymous list check returned zero objects.
- [x] Browser tests rejected an unsupported .exe and a file over 10 MiB with clear
  messages. Three artwork unit tests passed.
- [x] Local synthetic sign-in, SVG preview, and add-to-cart pass under the proposed
  enforced CSP. Preview SVGs use an img blob URL, never inline SVG markup.
- [x] Each mounted ArtworkImage owns and revokes its blob URL. The cart creates
  its own URL from the retained File, preserving artwork after studio navigation.
- [ ] Implement durable sales notification and customer receipt dispatch. The
  inspected browser insert and quote-creation triggers do not send these emails;
  the deployed Edge Functions list has no storefront inquiry/receipt dispatcher.
- [ ] Provide reference number, all line items, print colors, and secure artwork
  links in the notification and a summary in the customer's receipt.
- [ ] Run the seeded-account end-to-end test that asserts the persisted request,
  generated CRM quote/lines, both delivered emails, and artwork-link access.

## Dependencies

C1's Resend sender verification remains deferred until domain access is available.
TODO(bradley): Supply an authorized test visitor mailbox and approved quote email
copy. The test environment shares the live CRM database, so a real submission
would create production quote/pipeline records. Keep local synthetic testing until
the email setup and an explicitly isolated end-to-end test path are ready.

This trace documents a launch gap, not a completed notification implementation.
