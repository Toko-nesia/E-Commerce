# Tokonesia

Cross-border e-commerce app for Indonesian products sold to customers in Japan.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in the values.
2. Install dependencies with `npm install`.
3. Start the dev server with `npm run dev`.

Live Supabase is the source of truth for database schema and storage. This repo intentionally does not keep a root `supabase/` folder.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, Radix UI, MUI |
| Backend | Supabase Auth, PostgreSQL, Storage |
| Payment | Midtrans Snap |
| Shipping | FedEx Rate and Tracking APIs |
| Runtime validation | Zod |
| Tests | Vitest |

## Environment Variables

See `.env.example` for all required variables.

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Midtrans: `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`
- FedEx: `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER`, `FEDEX_API_URL`, `FEDEX_API_KEY`, `FEDEX_SECRET_KEY`, `FEDEX_TRACKING_API_URL`
- Exchange rate: `EXCHANGE_RATE_API_KEY`

## Architecture

```
src/
  app/                 Next.js pages, route handlers, and thin adapters
  application/         Use cases and request/response schemas
  domain/              Pure business rules for checkout, payment, pricing
  infrastructure/      Supabase, Midtrans, FedEx implementations
  contexts/            Client UI state providers
  lib/                 Framework and shared utility glue
  types/               App interfaces and generated live Supabase types
```

Key backend entry points:

- `POST /api/checkout/intents` creates or reuses an idempotent checkout intent.
- `POST /api/midtrans/notification` applies verified Midtrans events through the payment use case and database RPC.
- `POST /api/midtrans/create-transaction` is a compatibility shim and no longer creates orders from untrusted client totals.

## Supabase

Generate live project types into source code, not into a root Supabase folder:

```bash
npx supabase gen types typescript --project-id qvyeihaetcwwsypymjtp --schema public > src/types/supabase.ts
```

Important live database guarantees:

- `orders(user_id, idempotency_key)` has a unique partial index.
- `payment_events.event_hash` deduplicates repeated webhooks.
- Stock decrement is guarded by a server-side RPC that locks and decrements only once.
- RLS policies use explicit roles and `(select auth.uid())` patterns for better planner behavior.

## Scripts

```bash
npm run dev
npm run typecheck
npm run test
npm run build
```
