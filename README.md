# Tokonesia

Tokonesia is a cross-border e-commerce app for Indonesian products sold to customers in Japan. The app uses Next.js App Router for the web and API boundary, Supabase for auth/database/storage, Midtrans Snap for payment, and FedEx APIs for shipping rates and tracking.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, Radix UI, MUI |
| Backend | Supabase Auth, PostgreSQL, Storage |
| Payment | Midtrans Snap |
| Shipping | FedEx Rate and Tracking APIs |
| Runtime validation | Zod |
| Tests | Vitest |

## Getting Started

1. Install Node.js 24.x.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev`.

```bash
npm install
npm run dev
```

## Environment

Required application variables are listed in `.env.example`.

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Midtrans: `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`, `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION`
- FedEx Rate API: `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER`, `FEDEX_API_URL`
- FedEx Tracking API: `FEDEX_API_KEY`, `FEDEX_SECRET_KEY`, `FEDEX_TRACKING_API_URL`

Do not commit real secrets. `SUPABASE_DB_PASSWORD` is only needed temporarily for linked Supabase CLI maintenance, not for normal app runtime or production deployment.

## Architecture

The repo follows a clean architecture split. Pages and route handlers orchestrate; business rules live outside `src/app`.

```text
src/
  app/                 Next.js pages, route handlers, and thin adapters
  application/         Use cases, request schemas, and response orchestration
  domain/              Pure business rules and status transitions
  infrastructure/      Supabase, Midtrans, and FedEx implementations
  contexts/            Client UI state providers
  lib/                 Framework glue and shared utilities
  types/               App interfaces and generated live Supabase types
```

App Router conventions:

- Use `page.tsx` for UI routes.
- Use `route.ts` only for HTTP handlers such as `src/app/api/**` and auth callbacks.
- Keep direct Supabase, Midtrans, and FedEx calls in infrastructure or route adapter code, not inside reusable UI components.

Key backend entry points:

- `POST /api/checkout/intents` creates or reuses an idempotent checkout intent.
- `POST /api/midtrans/notification` applies verified Midtrans events through the payment use case.
- `POST /api/shipping/rates` calculates server-side FedEx rate estimates from validated cart and address data.
- `POST /api/catalog/cart/resolve` revalidates cart stock against live product data.
- Refund and cancellation transitions are handled through API routes, not direct client table updates.

## Supabase

Live Supabase remains the source of truth. The root `supabase/` folder mirrors the live project with local config and official migrations only.

```bash
supabase start
supabase db reset --local
supabase db push --linked --dry-run
```

Generate live database types into source code:

```bash
npx supabase gen types typescript --project-id qvyeihaetcwwsypymjtp --schema public > src/types/supabase.ts
```

Important database guarantees:

- `orders(user_id, idempotency_key)` prevents duplicate checkout intents.
- `payment_events.event_hash` deduplicates repeated payment webhooks.
- Stock decrement is guarded by a server-side RPC and only happens once per paid order.
- RLS policies use explicit roles and `(select auth.uid())` patterns where applicable.
- Phone, quantity, refund, and checkout boundaries are validated at API/use-case level with Zod.

Storage buckets:

- `product-images`: product catalog images uploaded through admin product workflows.
- `site-assets`: public page assets grouped by domain, such as `brands/`, `home/`, `about/`, `auth/`, and `profile/`.
- `avatars`: public profile avatar assets.

Do not commit Supabase CLI runtime files such as `.temp`, `.branches`, `snippets`, backups, dumps, or production data exports. Migration files must not contain live operational data such as products, orders, customers, exchange-rate rows, or store settings values.

## Quality Gates

Run the full local verification before merging:

```bash
npm run typecheck
npm run lint
npm run test
npm run audit
npm run build
```

Or run all three:

```bash
npm run check
```

## Repository Hygiene

- Keep generated runtime folders out of git: `.next`, `node_modules`, `.codex-logs`, `.vscode`, `tsconfig.tsbuildinfo`, and Supabase CLI runtime folders.
- Keep `.env`, `.env.local`, and all real credentials out of git.
- Keep `eslint.config.mjs`, `vitest.config.ts`, `supabase/config.toml`, and migration SQL files in git because they define reproducible local verification.
- If the Supabase advisor reports dashboard-only settings, fix them in the live dashboard and document any remaining platform limitation in the pull request.
