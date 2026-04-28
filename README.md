# Tokonesia (トコネシア)
### Indonesian Products for Japan

Cross-border e-commerce platform connecting Indonesian brands with customers in Japan.

---

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in all values
2. Run the image upload script (one-time):
   ```bash
   node scripts/upload-images.mjs
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + MUI |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Payment | Midtrans Snap |
| Shipping | FedEx Rate API |
| Exchange Rate | ExchangeRate-API |

---

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY` / `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `FEDEX_CLIENT_ID` / `FEDEX_CLIENT_SECRET` / `FEDEX_ACCOUNT_NUMBER` / `FEDEX_API_URL` — Rate API (shipping cost)
- `FEDEX_API_KEY` / `FEDEX_SECRET_KEY` — Basic Visibility / Tracking API (separate credentials)
- `EXCHANGE_RATE_API_KEY`

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@tokonesia.com | Admin123! |
| User | haruka@example.com | User123! |
| User | keiko@example.com | User123! |

---

## One-Time Setup

After setting env vars, run the image upload script to migrate images from `public/images/` to Supabase Storage:

```bash
node scripts/upload-images.mjs
```

Then enable the custom access token hook in Supabase Dashboard:
**Authentication → Hooks → Custom Access Token** → select `public.custom_access_token_hook`

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard (products, orders, categories, users, refunds)
│   ├── api/            # API routes (Midtrans, FedEx, exchange rate)
│   ├── cart/           # Shopping cart (weight-based checkout gate)
│   ├── checkout/       # Checkout (FedEx shipping + exchange rate)
│   ├── profile/        # User profile, order history, addresses
│   ├── shop/           # Product listing & filtering
│   ├── product/[id]/   # Product detail
│   └── components/     # Shared layout, modals, UI
├── contexts/           # AuthContext (Supabase), CartContext
├── lib/                # Supabase clients, FedEx, utilities
├── middleware.ts        # Route protection + role-based access
└── types/database.ts   # TypeScript interfaces
supabase/
├── functions/          # Edge Functions (refresh-exchange-rate)
└── migrations/         # Database migrations
scripts/
├── upload-images.mjs   # Upload public/images/ to Supabase Storage
└── seed-products-categories-brands.sql  # Re-seed products/categories/brands
```

---

## Running Tests

```bash
npx vitest run
```

62 property-based tests covering all correctness properties.
