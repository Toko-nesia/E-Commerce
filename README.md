# Tokonesia (トコネシア)
### Indonesian Products for Japan

Cross-border e-commerce platform connecting Indonesian brands with customers in Japan.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + MUI |
| Icons | Lucide React |
| Animations | Motion |
| Forms | React Hook Form |
| State | React Context API |
| Backend (planned) | Supabase (Auth + DB + Storage) |

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard (products, orders, categories)
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout flow
│   ├── complete-data/  # Post-register data completion
│   ├── login/          # Authentication
│   ├── register/       # User registration
│   ├── profile/        # User profile & order history
│   ├── shop/           # Product listing & filtering
│   ├── product/[id]/   # Product detail
│   ├── about/          # About & Terms
│   ├── order-success/  # Order confirmation
│   └── components/     # Shared: layout, modals, ui
├── contexts/           # AuthContext, CartContext
├── data/               # Mock data (products, orders, addresses, etc.)
├── lib/supabase/       # Supabase client placeholders (browser + server)
├── middleware.ts        # Route protection (ready for Supabase)
└── types/database.ts   # TypeScript interfaces mirroring DB schema
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, trending products, new product, why choose us |
| `/shop` | Product listing with search, filter by category, sort |
| `/product/[id]` | Product detail with specs, description, shipping info |
| `/cart` | Cart management with order summary |
| `/checkout` | Checkout with address, shipping, payment selection |
| `/order-success` | Order confirmation |
| `/login` | Login |
| `/register` | Register |
| `/complete-data` | Complete profile after registration |
| `/profile` | Profile, order history, saved addresses |
| `/about` | About us, brand partners, terms & conditions |
| `/admin` | Admin dashboard |
| `/admin/products` | Manage products |
| `/admin/orders` | Manage orders |
| `/admin/categories` | Manage categories |

---

## Current Status

- **Auth**: Mock implementation (always succeeds) — ready to swap with Supabase Auth
- **Data**: Hardcoded in `src/data/` — ready to swap with Supabase queries
- **Cart**: Persisted to `localStorage`
- **Backend**: Supabase client files exist but commented out, pending env vars

### To activate Supabase

1. `npm install @supabase/supabase-js @supabase/ssr`
2. Set env vars:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Uncomment code in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`
4. Uncomment middleware redirects in `src/middleware.ts`
5. Replace mock logic in `src/contexts/auth-context.tsx`
