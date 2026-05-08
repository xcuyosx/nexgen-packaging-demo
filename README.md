# NexGen Packaging Trade Show CRM

React, TypeScript, and Vite prototype for capturing booth leads, scoring opportunities, tracking follow-up tasks, and drafting email responses.

## Run locally

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Use the network URL from Vite to test the QR capture form on an iPad.

## Build

```bash
npm run build
```

## Supabase scaffold

The app works in local browser storage by default. To connect shared lead storage:

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Create an admin user in Supabase Auth.
4. Copy `.env.example` to `.env.local`.
5. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Set `VITE_USE_SUPABASE=true`.
7. Restart the Vite dev server.

The provided schema allows public QR form inserts and authenticated lead management. Once Supabase mode is enabled, the CRM dashboard requires email/password login, while `?capture=true` remains public for booth visitors.

Temporary anon read/update policies are included as comments for prototype testing only. Do not use those policies for a live trade show QR app.

## Deploy

This app is ready for Vercel static hosting. Set these environment variables in Vercel before deploying:

```bash
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://fbhernygpoapgilshsdq.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Build command: `npm run build`

Output directory: `dist`
