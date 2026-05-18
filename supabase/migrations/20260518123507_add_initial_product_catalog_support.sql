begin;

alter table public.products
  add column if not exists purchase_description text,
  add column if not exists source_provider text,
  add column if not exists source_product_id text,
  add column if not exists source_url text,
  add column if not exists source_query text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists bootstrap_key text,
  add column if not exists pricing_type text not null default 'fixed',
  add column if not exists min_price_raw bigint,
  add column if not exists max_price_raw bigint;

alter table public.products
  drop constraint if exists products_pricing_type_check;

alter table public.products
  add constraint products_pricing_type_check
  check (pricing_type in ('fixed', 'variant', 'custom_amount'));

alter table public.products
  drop constraint if exists products_custom_amount_range_check;

alter table public.products
  add constraint products_custom_amount_range_check
  check (
    pricing_type <> 'custom_amount'
    or (
      min_price_raw is not null
      and max_price_raw is not null
      and min_price_raw > 0
      and max_price_raw >= min_price_raw
    )
  );

create unique index if not exists idx_products_bootstrap_key
  on public.products (bootstrap_key)
  where bootstrap_key is not null;

create unique index if not exists idx_products_source_identity
  on public.products (source_provider, source_product_id)
  where source_provider is not null and source_product_id is not null;

create index if not exists idx_products_pricing_type
  on public.products (pricing_type);

create table if not exists public.product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price text not null,
  price_raw bigint not null check (price_raw > 0),
  stock integer not null default 0 check (stock >= 0),
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  source_variant_id text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name)
);

create unique index if not exists idx_product_variants_source_identity
  on public.product_variants (product_id, source_variant_id)
  where source_variant_id is not null;

create index if not exists idx_product_variants_product_id
  on public.product_variants (product_id);

alter table public.product_variants enable row level security;

drop policy if exists "Product variants are publicly readable" on public.product_variants;
create policy "Product variants are publicly readable"
  on public.product_variants
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins manage product variants" on public.product_variants;
create policy "Admins manage product variants"
  on public.product_variants
  for all
  to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

alter table public.order_items
  add column if not exists product_variant_id bigint references public.product_variants(id) on delete set null,
  add column if not exists custom_amount_raw bigint,
  add column if not exists purchase_description_snapshot text,
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb;

alter table public.order_items
  drop constraint if exists order_items_custom_amount_raw_check;

alter table public.order_items
  add constraint order_items_custom_amount_raw_check
  check (custom_amount_raw is null or custom_amount_raw > 0);

create index if not exists idx_order_items_product_variant_id
  on public.order_items (product_variant_id);

create or replace function public.release_order_stock_once(
  p_order_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('status', 'order_not_found');
  end if;

  if v_order.stock_released_at is not null then
    return jsonb_build_object(
      'status', 'already_released',
      'order_id', v_order.id,
      'released_at', v_order.stock_released_at
    );
  end if;

  if v_order.stock_reserved_at is null and v_order.stock_decremented_at is null then
    return jsonb_build_object('status', 'no_stock_to_release', 'order_id', v_order.id);
  end if;

  update public.product_variants as product_variants
  set stock = product_variants.stock + items.quantity,
      updated_at = now()
  from (
    select order_items.product_variant_id, sum(order_items.quantity)::integer as quantity
    from public.order_items as order_items
    where order_items.order_id = v_order.id
      and order_items.product_variant_id is not null
    group by order_items.product_variant_id
  ) as items
  where product_variants.id = items.product_variant_id;

  update public.products as products
  set stock = products.stock + items.quantity,
      updated_at = now()
  from (
    select order_items.product_id, sum(order_items.quantity)::integer as quantity
    from public.order_items as order_items
    where order_items.order_id = v_order.id
      and order_items.product_variant_id is null
    group by order_items.product_id
  ) as items
  where products.id = items.product_id;

  update public.orders
  set stock_released_at = now(),
      stock_release_reason = left(coalesce(nullif(p_reason, ''), 'unspecified'), 80),
      updated_at = now()
  where id = v_order.id
    and stock_released_at is null;

  return jsonb_build_object('status', 'released', 'order_id', v_order.id);
end;
$$;

revoke all on function public.release_order_stock_once(uuid, text) from public, anon, authenticated;
grant execute on function public.release_order_stock_once(uuid, text) to service_role;

create or replace function public.create_checkout_order_with_stock_reservation(
  p_order_id uuid,
  p_user_id uuid,
  p_midtrans_order_id text,
  p_idempotency_key text,
  p_cart_fingerprint text,
  p_address_id uuid,
  p_address_snapshot jsonb,
  p_pricing_snapshot jsonb,
  p_shipping_snapshot jsonb,
  p_cart_snapshot jsonb,
  p_items jsonb,
  p_total_price_raw bigint,
  p_total_price text,
  p_shipping_cost bigint,
  p_service_fee bigint,
  p_note text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item record;
  v_stock integer;
  v_now timestamptz := now();
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Checkout items are required' using errcode = '22023';
  end if;

  if p_total_price_raw <= 0 then
    raise exception 'Order total must be positive' using errcode = '22023';
  end if;

  for v_item in
    select
      item.product_id::bigint as product_id,
      nullif(item.product_variant_id, 0)::bigint as product_variant_id,
      sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(
      product_id bigint,
      product_variant_id bigint,
      quantity integer,
      price_raw bigint,
      price text,
      custom_amount_raw bigint,
      purchase_description_snapshot text,
      source_snapshot jsonb
    )
    group by item.product_id, nullif(item.product_variant_id, 0)
    order by item.product_id, nullif(item.product_variant_id, 0)
  loop
    if v_item.product_id is null or v_item.product_id <= 0 or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Invalid checkout item' using errcode = '22023';
    end if;

    if v_item.product_variant_id is not null then
      select product_variants.stock into v_stock
      from public.product_variants as product_variants
      where product_variants.id = v_item.product_variant_id
        and product_variants.product_id = v_item.product_id
      for update;

      if not found then
        raise exception 'Product variant % is no longer available', v_item.product_variant_id using errcode = 'P0002';
      end if;
    else
      select products.stock into v_stock
      from public.products as products
      where products.id = v_item.product_id
      for update;

      if not found then
        raise exception 'Product % is no longer available', v_item.product_id using errcode = 'P0002';
      end if;
    end if;

    if v_stock < v_item.quantity then
      raise exception 'Insufficient stock for product %', v_item.product_id using errcode = 'P0001';
    end if;
  end loop;

  insert into public.orders (
    id,
    user_id,
    status,
    payment_status,
    payment_method,
    midtrans_order_id,
    idempotency_key,
    cart_fingerprint,
    address_id,
    address_snapshot,
    pricing_snapshot,
    shipping_snapshot,
    cart_snapshot,
    total_price_raw,
    total_price,
    shipping_cost,
    service_fee,
    note,
    estimated_delivery,
    stock_reserved_at,
    created_at,
    updated_at
  ) values (
    p_order_id,
    p_user_id,
    'PAYMENT_PENDING',
    'pending',
    'bank_transfer',
    p_midtrans_order_id,
    p_idempotency_key,
    p_cart_fingerprint,
    p_address_id,
    coalesce(p_address_snapshot, '{}'::jsonb),
    coalesce(p_pricing_snapshot, '{}'::jsonb),
    coalesce(p_shipping_snapshot, '{}'::jsonb),
    coalesce(p_cart_snapshot, '[]'::jsonb),
    p_total_price_raw,
    p_total_price,
    p_shipping_cost,
    p_service_fee,
    nullif(p_note, ''),
    nullif(p_shipping_snapshot->>'estimatedDelivery', ''),
    v_now,
    v_now,
    v_now
  );

  insert into public.order_items (
    order_id,
    product_id,
    product_variant_id,
    quantity,
    price_raw,
    price,
    custom_amount_raw,
    purchase_description_snapshot,
    source_snapshot
  )
  select
    p_order_id,
    item.product_id::integer,
    nullif(item.product_variant_id, 0)::bigint,
    item.quantity::integer,
    item.price_raw::integer,
    item.price,
    item.custom_amount_raw::bigint,
    item.purchase_description_snapshot,
    coalesce(item.source_snapshot, '{}'::jsonb)
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    product_variant_id bigint,
    quantity integer,
    price_raw bigint,
    price text,
    custom_amount_raw bigint,
    purchase_description_snapshot text,
    source_snapshot jsonb
  );

  update public.product_variants as product_variants
  set stock = product_variants.stock - items.quantity,
      updated_at = v_now
  from (
    select nullif(item.product_variant_id, 0)::bigint as product_variant_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(
      product_id bigint,
      product_variant_id bigint,
      quantity integer,
      price_raw bigint,
      price text,
      custom_amount_raw bigint,
      purchase_description_snapshot text,
      source_snapshot jsonb
    )
    where nullif(item.product_variant_id, 0) is not null
    group by nullif(item.product_variant_id, 0)
  ) as items
  where product_variants.id = items.product_variant_id;

  update public.products as products
  set stock = products.stock - items.quantity,
      updated_at = v_now
  from (
    select item.product_id::bigint as product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(
      product_id bigint,
      product_variant_id bigint,
      quantity integer,
      price_raw bigint,
      price text,
      custom_amount_raw bigint,
      purchase_description_snapshot text,
      source_snapshot jsonb
    )
    where nullif(item.product_variant_id, 0) is null
    group by item.product_id
  ) as items
  where products.id = items.product_id;

  return jsonb_build_object(
    'id', p_order_id,
    'midtrans_order_id', p_midtrans_order_id,
    'stock_reserved_at', v_now
  );
end;
$$;

revoke all on function public.create_checkout_order_with_stock_reservation(
  uuid, uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, text, bigint, bigint, text
) from public, anon, authenticated;
grant execute on function public.create_checkout_order_with_stock_reservation(
  uuid, uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, text, bigint, bigint, text
) to service_role;

commit;
