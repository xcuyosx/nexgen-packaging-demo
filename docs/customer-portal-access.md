# Quote-focused customer portal

The customer account contains quote-request history, a request-a-quote entry
point, CRM-managed company details, billing preferences, delivery locations, and
Contact NexGen. Orders and payment-method controls are hidden. Old order URLs
return to the account home and account loading does not depend on order history.

The CRM administrator prepares, suspends, or restores portal access from the
customer's Account screen. A prepared contact registers and verifies its own
email; preparation sends no invitation and assigns no password. The database
links registration to the reserved CRM company. Billing/delivery saves use the
revision-checked preferences RPC and preserve unconfirmed edits on failure.

Required CRM database migrations:
- 20261004060059_customer_portal_field_ownership.sql
- 20261004063741_customer_portal_administration.sql

Auth email verification and password-reset delivery require the deferred email
configuration. This release does not enable notification workers or send
customer invitations. The pending inquiry-form integration is excluded; the
existing contact-by-email flow remains in the release.
