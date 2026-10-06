Portal brief 2 verification

Unit tests: npm.cmd test
Contact browser tests: npm.cmd run test:inquiries:browser

Staging Playwright: node scripts/verify-portal-staging.mjs <mode>
Required environment: PORTAL_QA_EMAIL, PORTAL_QA_PASSWORD,
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (public anon key only).
Optional: PLAYWRIGHT_BROWSERS_PATH, PORTAL_QA_OUTPUT,
PORTAL_QA_BASE_URL (only the named staging host or loopback is accepted).
Never put credentials in source control or the report.

The runner is an explicit QA fixture regression, not a generic production seed.
It refuses any identity except the existing October 5 portal tester. Its outputs
and hosted-qa-state.json belong in PORTAL_QA_OUTPUT, outside tracked source.
Run modes sequentially: they share the output state and checks file.

Modes:
  submit: creates billing/delivery fixtures, restores preferences in finally,
          submits a standard/custom artwork request and a contact inquiry.
          Requires released-quote.pdf in the output folder for the extra file.
          Refuses to submit again if a recorded request already exists.
  list: checks the recorded request and submits an explicitly tagged QA inquiry.
  release: uses the recorded priced QA release, downloads the PDF and posts a
           change request. The quote must first be released by staff.
  reply: checks the existing QA staff reply and desktop/mobile layout.
  accept: QA-only flag must be enabled by an authorized admin, then turned OFF
          in a finally block outside this runner. Never enable customer-wide
          acceptance while terms_version is pending-counsel.
  resubmit: verifies unavailable-product feedback, copies a real family request,
            confirms missing artwork blocks submission, removes the custom line,
            and submits one remaining QA line via the safe receipt RPC.
  security: checks anonymous RPC/table denial, cross-customer URLs, private
            storage, owner PDF ticket/tamper rejection, and staging noindex.

Admin CRM release, mapping, reply and business/QA isolation were verified
through the existing signed-in administrator browser. The second hosted
customer's RLS checks used its database JWT identity with a positive control;
no second customer password was changed or assumed.

The CRM repository contains scripts/test-storefront-catalog-mapping.mjs and
scripts/test-portal-flow.mjs plus portal-brief2-browser.mjs. These use disposable
PostgreSQL on loopback (PORTAL_TEST_DATABASE_URL must name a fresh
portal_ownership_test_<digits> database). Set PORTAL_TEST_PG_MODULE to the pg
module, PORTAL_TEST_STOREFRONT_ROOT to this checkout, and PORTAL_TEST_OUTPUT
to an output directory. Do not point these schema/fixture tests at Supabase.

Email proof is blocked on Resend sender verification. Allowed proof recipient:
bradley@nexgenpac.com. Sender/shared contact: orders@nexgenpac.com. Both the
environment and database mail switches remain OFF. The separate QA customer
login remains unchanged so Bradley's CRM administrator identity is preserved.
