# Tokonesia

Tokonesia is a cross-border e-commerce app for Indonesian products sold to customers in Japan. The app uses Next.js App Router for the web and API boundary, Supabase for auth/database/storage, Midtrans Snap for payment, FedEx APIs for shipping rates and tracking, and Brevo for transactional email.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, Radix UI, MUI |
| Backend | Supabase Auth, PostgreSQL, Storage |
| Payment | Midtrans Snap |
| Shipping | FedEx Rate and Tracking APIs |
| Email | Supabase Auth SMTP and Brevo Transactional Email API |
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
- Brevo: `BREVO_API_KEY`, `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_REPLY_TO_ADDRESS`

Do not commit real secrets.

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
- `GET /api/orders/:id/payment` returns the owner-only pending payment summary and reusable Snap token.
- `POST /api/orders/:id/sync-payment` asks Midtrans for the current transaction status and applies the same idempotent transition used by webhooks.
- `POST /api/orders/:id/expire-pending-payment` expires an unpaid order after its Snap token window ends.
- `POST /api/midtrans/notification` applies verified Midtrans events through the payment use case.
- `POST /api/auth/verify-email-otp` verifies Supabase email OTP after registration.
- `POST /api/auth/resend-email-otp` resends a pending signup verification code.
- `PATCH /api/admin/orders/:id/status` updates order status server-side and dispatches order emails.
- `POST /api/shipping/rates` calculates server-side FedEx rate estimates from validated cart and address data.
- `POST /api/catalog/cart/resolve` revalidates cart stock against live product data.
- Refund and cancellation transitions are handled through API routes, not direct client table updates.

## Supabase

Live Supabase remains the source of truth. The root `supabase/` folder mirrors the live project with local config and official migrations only.

```bash
supabase start
supabase db reset --local
npm run supabase:bootstrap-assets
supabase db push --linked --dry-run
```

Generate live database types into source code:

```bash
npx supabase gen types typescript --project-id qvyeihaetcwwsypymjtp --schema public > src/types/supabase.ts
```

Important database guarantees:

- `orders(user_id, idempotency_key)` prevents duplicate checkout intents.
- `payment_events.event_hash` deduplicates repeated payment webhooks.
- `email_events.dedupe_key` prevents duplicate transactional emails for the same event and recipient.
- Checkout order creation reserves stock immediately through an atomic RPC, so pending Virtual Account orders cannot oversell inventory.
- Stock release is idempotent and runs once when an unpaid payment expires/fails, an order is cancelled, or a refund flow completes.
- New checkout orders start as `PAYMENT_PENDING` with `payment_status = "pending"`; they cannot enter seller processing until Midtrans confirms `settlement` or accepted `capture`.
- RLS policies use explicit roles and `(select auth.uid())` patterns where applicable.
- Phone, quantity, refund, and checkout boundaries are validated at API/use-case level with Zod.

Auth and email:

- Email/password registration uses Supabase email OTP confirmation. Unverified users are kept in Supabase Auth and can resend OTP; they are not deleted automatically.
- The verification page locks the pending email address. Changing an email returns to registration with the previous email prefilled so the user explicitly starts a corrected signup.
- Forgot password uses Supabase recovery links. The recovery email redirects through `/auth/confirm?next=/reset-password`, the server verifies the recovery token hash, then the user creates a new password on `/reset-password` and is signed out before returning to login.
- Password changes for reset, customer profile, and admin profile go through `PATCH /api/auth/password`, which applies the shared 12-character/lowercase/uppercase/number/symbol rule and returns detailed validation issues.
- Supabase Custom SMTP is configured through `supabase/config.toml` for Auth emails.
- Business emails are sent by the app through Brevo Transactional Email API and audited in `email_events`.
- A welcome email is sent once after email OTP verification or first-time Google OAuth signup.
- After changing Supabase Auth email settings, load the Brevo env vars locally and run `supabase config push --project-ref qvyeihaetcwwsypymjtp --yes`.
- The live Auth config should keep production redirects intact while enabling email OTP, password recovery, strong password policy, and Brevo SMTP. Production Auth redirect allow-list must include the site origin, `/auth/callback`, `/auth/confirm`, and `/reset-password`.

Payments:

- Checkout supports Virtual Account only. The checkout selector and Midtrans Snap payload both use Midtrans bank transfer (`enabled_payments: ["bank_transfer"]`).
- Closing the Snap popup leaves the order in pending payment state and redirects to `/order-pending?orderId=...`.
- Customers can continue the same pending payment until `snap_token_expires_at`; expired unpaid orders move to failed/expired state and release reserved stock.
- The success and pending pages call the server-side payment sync endpoint to avoid the Midtrans webhook race where Snap returns success before the database has received the webhook.

Storage buckets:

- `product-images`: product catalog images uploaded through admin product workflows.
- `site-assets`: public page assets grouped by domain, such as `brands/`, `home/`, `about/`, `auth/`, and `profile/`.
- `avatars`: public profile avatar assets.
- Bootstrap site assets live in `supabase/storage/site-assets/**`. Run `npm run supabase:bootstrap-assets` after a fresh migration/reset to upload the essential page images into the configured Supabase project.

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
