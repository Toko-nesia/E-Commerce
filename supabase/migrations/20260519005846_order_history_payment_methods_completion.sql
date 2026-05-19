alter table public.orders
  add column if not exists estimated_delivery_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists completion_deadline_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_payment_method_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method is null or payment_method = '' or payment_method in ('bank_transfer', 'credit_card'));
  end if;
end $$;

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  actor_type text not null check (actor_type in ('buyer', 'seller', 'admin', 'system', 'payment_provider')),
  actor_user_id uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status text,
  from_payment_status text,
  to_payment_status text,
  title text not null,
  description text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz not null default now(),
  constraint order_status_events_title_length_check check (char_length(title) between 1 and 120),
  constraint order_status_events_description_length_check check (char_length(description) between 1 and 1000)
);

create unique index if not exists order_status_events_dedupe_key_idx
  on public.order_status_events (dedupe_key)
  where dedupe_key is not null;

create index if not exists order_status_events_order_created_idx
  on public.order_status_events (order_id, created_at desc);

create index if not exists order_status_events_actor_user_idx
  on public.order_status_events (actor_user_id, created_at desc)
  where actor_user_id is not null;

alter table public.order_status_events enable row level security;

drop policy if exists order_status_events_select_own_or_admin on public.order_status_events;
create policy order_status_events_select_own_or_admin
  on public.order_status_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_status_events.order_id
        and (o.user_id = (select auth.uid()) or app_private.is_admin())
    )
  );

grant all on table public.order_status_events to service_role;
grant select on table public.order_status_events to authenticated;

drop function if exists public.create_checkout_order_with_stock_reservation(
  uuid, uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, text, bigint, bigint, text
);

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
  p_note text,
  p_payment_method text default 'bank_transfer'
) returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_item record;
  v_stock integer;
  v_now timestamptz := now();
  v_estimated_delivery_at timestamptz;
begin
  if p_payment_method not in ('bank_transfer', 'credit_card') then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Checkout items are required' using errcode = '22023';
  end if;

  if p_total_price_raw <= 0 then
    raise exception 'Order total must be positive' using errcode = '22023';
  end if;

  begin
    v_estimated_delivery_at := nullif(p_shipping_snapshot->>'estimatedDeliveryDate', '')::timestamptz;
  exception when others then
    v_estimated_delivery_at := null;
  end;

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
      buyer_note text
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
    estimated_delivery_at,
    stock_reserved_at,
    created_at,
    updated_at
  ) values (
    p_order_id,
    p_user_id,
    'PAYMENT_PENDING',
    'pending',
    p_payment_method,
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
    v_estimated_delivery_at,
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
    buyer_note
  )
  select
    p_order_id,
    item.product_id::integer,
    nullif(item.product_variant_id, 0)::bigint,
    item.quantity::integer,
    item.price_raw::integer,
    item.price,
    item.custom_amount_raw::bigint,
    nullif(left(coalesce(item.buyer_note, ''), 2000), '')
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    product_variant_id bigint,
    quantity integer,
    price_raw bigint,
    price text,
    custom_amount_raw bigint,
    buyer_note text
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
      buyer_note text
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
      buyer_note text
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
  uuid, uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, text, bigint, bigint, text, text
) from public;
grant all on function public.create_checkout_order_with_stock_reservation(
  uuid, uuid, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, jsonb, bigint, text, bigint, bigint, text, text
) to service_role;

create or replace function public.get_trending_products(p_limit integer default 4, p_now timestamptz default now())
returns setof public.products
language sql
stable
set search_path to 'public'
as $$
  with params as (
    select
      greatest(1, least(coalesce(p_limit, 4), 20)) as limit_count,
      coalesce(p_now, now()) as now_value
  ),
  paid_orders as (
    select o.id, o.paid_at
    from public.orders o, params
    where o.paid_at is not null
      and o.paid_at >= params.now_value - interval '30 days'
      and o.payment_status in ('settlement', 'capture')
      and o.status <> all (array[
        'DIBATALKAN',
        'REFUNDED',
        'CANCEL_REQUESTED',
        'CANCEL_APPROVED',
        'REFUND_INFO_SUBMITTED'
      ])
  ),
  paid_items as (
    select
      oi.product_id,
      sum(
        oi.quantity::double precision
        * power(
          0.5::double precision,
          greatest(0, extract(epoch from ((select now_value from params) - po.paid_at)) / 86400.0) / 14.0
        )
      ) as weighted_units,
      sum(
        ((oi.quantity * oi.price_raw)::double precision / 100000.0)
        * 0.15
        * power(
          0.5::double precision,
          greatest(0, extract(epoch from ((select now_value from params) - po.paid_at)) / 86400.0) / 14.0
        )
      ) as weighted_revenue,
      max(po.paid_at) as latest_paid_at
    from paid_orders po
    join public.order_items oi on oi.order_id = po.id
    join public.products p on p.id = oi.product_id
    where p.stock > 0
    group by oi.product_id
  ),
  ranked as (
    select
      p.*,
      coalesce(pi.weighted_units, 0) + coalesce(pi.weighted_revenue, 0) as trending_score,
      pi.latest_paid_at,
      0 as sort_group
    from paid_items pi
    join public.products p on p.id = pi.product_id
  ),
  fallback as (
    select
      p.*,
      0::double precision as trending_score,
      null::timestamptz as latest_paid_at,
      1 as sort_group
    from public.products p
    where p.stock > 0
      and not exists (select 1 from ranked r where r.id = p.id)
  ),
  candidates as (
    select * from ranked
    union all
    select * from fallback
  )
  select
    id,
    name,
    category,
    price,
    price_raw,
    badge,
    badge_color,
    badge_width,
    image,
    img_style,
    description,
    specifications,
    stock,
    weight_kg,
    created_at,
    updated_at,
    bootstrap_key,
    pricing_type,
    min_price_raw,
    max_price_raw,
    purchase_instructions
  from candidates
  order by
    sort_group asc,
    trending_score desc,
    latest_paid_at desc nulls last,
    case when sort_group = 1 then updated_at end desc nulls last,
    id asc
  limit (select limit_count from params);
$$;

revoke all on function public.get_trending_products(integer, timestamptz) from public;
grant all on function public.get_trending_products(integer, timestamptz) to service_role;
