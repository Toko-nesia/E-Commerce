-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access to profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- PRODUCTS policies
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update products" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete products" ON public.products FOR DELETE USING (public.is_admin());

-- CATEGORIES policies
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- BRANDS policies
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admin insert brands" ON public.brands FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update brands" ON public.brands FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete brands" ON public.brands FOR DELETE USING (public.is_admin());

-- ORDERS policies
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access to orders" ON public.orders FOR ALL USING (public.is_admin());

-- ORDER_ITEMS policies
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admin full access to order items" ON public.order_items FOR ALL USING (public.is_admin());

-- ADDRESSES policies
CREATE POLICY "Users CRUD own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin read all addresses" ON public.addresses FOR SELECT USING (public.is_admin());

-- EXCHANGE_RATES policies
CREATE POLICY "Public read exchange rates" ON public.exchange_rates FOR SELECT USING (true);

-- REFUND_REQUESTS policies
CREATE POLICY "Users read own refund requests" ON public.refund_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own refund requests" ON public.refund_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access to refund requests" ON public.refund_requests FOR ALL USING (public.is_admin());;
