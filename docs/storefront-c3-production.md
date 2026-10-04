# C3: prevent production demo fallback

Production builds require non-empty `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`. Vite stops with a clear message naming missing settings
before producing a deployable bundle. Configure the public URL and anonymous key
in the Vercel project or an ignored local environment file; never use a service
role or secret key for these client settings.

Fictional customer details, orders, IDs, and catalog preview rows are gated by
`import.meta.env.DEV` and removed from production bundles. Local development can
still use the existing preview workflow.

## Acceptance

- [x] Real build attempts with both settings missing, only the URL present, or
  only the key present all fail.
- [x] A correctly configured production build succeeds.
- [x] Its JavaScript contains none of the fictional customer name, email domain,
  phone, billing, shipping, or payment identifiers, and no local bridge URL.
- [x] Lint and TypeScript checks pass.

Repeat the build checks with `node scripts/check-production-build.mjs`. They use
synthetic configuration and a disposable output directory, without contacting
the database or modifying a remote deployment.
