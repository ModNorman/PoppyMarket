# Poppy Market – MVP

Generated 2025-08-08T12:58:21.558470

- React app with Seller/Admin dashboards, Users page, auth, date filter, stats & logs.
- Supabase Edge Functions implement **real bonus calculation** and **payout-run snapshotting** with proportional distribution.

## Dev
cd app && pnpm install && cp .env.example .env.local && pnpm dev

## Deploy
Import `app/` into Vercel. Add env vars. Deploy.
Deploy functions with `supabase functions deploy <name>` and set `.env` per `supabase/functions/.env.example`.
