create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated, service_role;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
      avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
      updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

drop policy if exists "Admin read all addresses" on public.addresses;
drop policy if exists "Users CRUD own addresses" on public.addresses;
drop policy if exists "Admin delete brands" on public.brands;
drop policy if exists "Admin insert brands" on public.brands;
drop policy if exists "Admin update brands" on public.brands;
drop policy if exists "Public read brands" on public.brands;
drop policy if exists "Admin delete categories" on public.categories;
drop policy if exists "Admin insert categories" on public.categories;
drop policy if exists "Admin update categories" on public.categories;
drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public read exchange rates" on public.exchange_rates;
drop policy if exists "Admin full access to order items" on public.order_items;
drop policy if exists "Users insert own order items" on public.order_items;
drop policy if exists "Users read own order items" on public.order_items;
drop policy if exists "Admin full access to orders" on public.orders;
drop policy if exists "Users insert own orders" on public.orders;
drop policy if exists "Users read own orders" on public.orders;
drop policy if exists "Admin delete products" on public.products;
drop policy if exists "Admin insert products" on public.products;
drop policy if exists "Admin update products" on public.products;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Admin full access to profiles" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admin full access to refund requests" on public.refund_requests;
drop policy if exists "Users insert own refund requests" on public.refund_requests;
drop policy if exists "Users read own refund requests" on public.refund_requests;
drop policy if exists "Admin full access" on public.store_settings;

create policy "addresses_select_own_or_admin"
  on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin());
create policy "addresses_insert_own_or_admin"
  on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()) or app_private.is_admin());
create policy "addresses_update_own_or_admin"
  on public.addresses for update to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin())
  with check (user_id = (select auth.uid()) or app_private.is_admin());
create policy "addresses_delete_own_or_admin"
  on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin());

create policy "brands_public_select"
  on public.brands for select to anon, authenticated
  using (true);
create policy "brands_admin_insert"
  on public.brands for insert to authenticated
  with check (app_private.is_admin());
create policy "brands_admin_update"
  on public.brands for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "brands_admin_delete"
  on public.brands for delete to authenticated
  using (app_private.is_admin());

create policy "categories_public_select"
  on public.categories for select to anon, authenticated
  using (true);
create policy "categories_admin_insert"
  on public.categories for insert to authenticated
  with check (app_private.is_admin());
create policy "categories_admin_update"
  on public.categories for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "categories_admin_delete"
  on public.categories for delete to authenticated
  using (app_private.is_admin());

create policy "exchange_rates_public_select"
  on public.exchange_rates for select to anon, authenticated
  using (true);

create policy "orders_select_own_or_admin"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin());
create policy "orders_insert_own_or_admin"
  on public.orders for insert to authenticated
  with check (user_id = (select auth.uid()) or app_private.is_admin());
create policy "orders_update_own_or_admin"
  on public.orders for update to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin())
  with check (user_id = (select auth.uid()) or app_private.is_admin());

create policy "order_items_select_own_or_admin"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid()) or app_private.is_admin())
  ));
create policy "order_items_insert_own_or_admin"
  on public.order_items for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = (select auth.uid()) or app_private.is_admin())
  ));
create policy "order_items_admin_update"
  on public.order_items for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "order_items_admin_delete"
  on public.order_items for delete to authenticated
  using (app_private.is_admin());

create policy "products_public_select"
  on public.products for select to anon, authenticated
  using (true);
create policy "products_admin_insert"
  on public.products for insert to authenticated
  with check (app_private.is_admin());
create policy "products_admin_update"
  on public.products for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "products_admin_delete"
  on public.products for delete to authenticated
  using (app_private.is_admin());

create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or app_private.is_admin());
create policy "profiles_update_own_or_admin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or app_private.is_admin())
  with check (id = (select auth.uid()) or app_private.is_admin());

create policy "refund_requests_select_own_or_admin"
  on public.refund_requests for select to authenticated
  using (user_id = (select auth.uid()) or app_private.is_admin());
create policy "refund_requests_insert_own_or_admin"
  on public.refund_requests for insert to authenticated
  with check (user_id = (select auth.uid()) or app_private.is_admin());
create policy "refund_requests_update_admin"
  on public.refund_requests for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "refund_requests_delete_admin"
  on public.refund_requests for delete to authenticated
  using (app_private.is_admin());

create policy "store_settings_admin_select"
  on public.store_settings for select to authenticated
  using (app_private.is_admin());
create policy "store_settings_admin_insert"
  on public.store_settings for insert to authenticated
  with check (app_private.is_admin());
create policy "store_settings_admin_update"
  on public.store_settings for update to authenticated
  using (app_private.is_admin()) with check (app_private.is_admin());
create policy "store_settings_admin_delete"
  on public.store_settings for delete to authenticated
  using (app_private.is_admin());

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;

DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;

create policy "avatars_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "product_images_admin_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and app_private.is_admin());
create policy "product_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and app_private.is_admin());
create policy "product_images_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and app_private.is_admin())
  with check (bucket_id = 'product-images' and app_private.is_admin());
create policy "product_images_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and app_private.is_admin());
