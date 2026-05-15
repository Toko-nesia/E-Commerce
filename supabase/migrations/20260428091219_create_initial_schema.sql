-- 1. profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. products table
CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  price text NOT NULL,
  price_raw bigint NOT NULL,
  badge text DEFAULT '',
  badge_color text DEFAULT '',
  badge_width text DEFAULT '',
  image text NOT NULL,
  img_style text DEFAULT '',
  description text DEFAULT '',
  specifications jsonb DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  img text NOT NULL,
  width integer DEFAULT 0,
  height integer DEFAULT 0,
  overflow boolean DEFAULT false,
  style text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'BARU' CHECK (status IN ('BARU', 'DIPROSES', 'DIKIRIM', 'SELESAI', 'DIBATALKAN')),
  status_color text DEFAULT '',
  total_price_raw bigint NOT NULL,
  total_price text DEFAULT '',
  payment_method text DEFAULT '',
  midtrans_order_id text UNIQUE,
  midtrans_transaction_id text DEFAULT '',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_url text DEFAULT '',
  tracking_number text DEFAULT '',
  estimated_delivery text DEFAULT '',
  cancel_reason text DEFAULT '',
  note text DEFAULT '',
  shipping_cost bigint DEFAULT 0,
  service_fee bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_raw bigint NOT NULL,
  price text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text DEFAULT '',
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  full_address text DEFAULT '',
  details text DEFAULT '',
  postal_code text DEFAULT '',
  country_code text NOT NULL DEFAULT 'JP',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. exchange_rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);

-- 9. refund_requests table
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  refund_method text NOT NULL,
  account_number text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);;
