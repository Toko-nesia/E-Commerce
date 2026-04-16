# Zenbin — Cross-border E-Commerce (Indonesia → Japan)

A Next.js 15 application connecting Indonesian brands with customers in Japan.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/          # Next.js App Router pages & layout
├── components/   # Shared components (layout, modals, ui)
├── contexts/     # React contexts (auth)
├── data/         # Hardcoded data (future: Supabase queries)
├── lib/          # Supabase client placeholders
├── middleware.ts  # Route protection
└── types/        # TypeScript types (Supabase schema)
```