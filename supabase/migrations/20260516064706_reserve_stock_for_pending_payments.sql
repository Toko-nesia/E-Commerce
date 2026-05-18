begin;

alter table public.orders
  add column if not exists stock_reserved_at timestamptz,
  add column if not exists stock_released_at timestamptz,
  add column if not exists stock_release_reason text;

create index if not exists orders_pending_payment_expiry_idx
  on public.orders (snap_token_expires_at)
  where payment_status = 'pending'
    and snap_token_expires_at is not null
    and stock_released_at is null;

create index if not exists orders_stock_release_audit_idx
  on public.orders (stock_released_at desc)
  where stock_released_at is not null;

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

  update public.products as products
  set stock = products.stock + items.quantity,
      updated_at = now()
  from (
    select order_items.product_id, sum(order_items.quantity)::integer as quantity
    from public.order_items as order_items
    where order_items.order_id = v_order.id
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
    select item.product_id::bigint as product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(
      product_id bigint,
      quantity integer,
      price_raw bigint,
      price text
    )
    group by item.product_id
    order by item.product_id
  loop
    if v_item.product_id is null or v_item.product_id <= 0 or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Invalid checkout item' using errcode = '22023';
    end if;

    select products.stock into v_stock
    from public.products as products
    where products.id = v_item.product_id
    for update;

    if not found then
      raise exception 'Product % is no longer available', v_item.product_id using errcode = 'P0002';
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
    'BARU',
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

  insert into public.order_items (order_id, product_id, quantity, price_raw, price)
  select
    p_order_id,
    item.product_id::integer,
    item.quantity::integer,
    item.price_raw::integer,
    item.price
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    quantity integer,
    price_raw bigint,
    price text
  );

  update public.products as products
  set stock = products.stock - items.quantity,
      updated_at = v_now
  from (
    select item.product_id::bigint as product_id, sum(item.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(
      product_id bigint,
      quantity integer,
      price_raw bigint,
      price text
    )
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

create or replace function public.expire_pending_payment_order(
  p_order_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_release jsonb;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object('status', 'order_not_found');
  end if;

  if v_order.user_id <> p_user_id then
    return jsonb_build_object('status', 'forbidden');
  end if;

  if v_order.payment_status in ('settlement', 'capture') then
    return jsonb_build_object('status', 'already_paid', 'order_id', v_order.id);
  end if;

  if v_order.payment_status <> 'pending' then
    return jsonb_build_object('status', 'not_pending', 'order_id', v_order.id, 'payment_status', v_order.payment_status);
  end if;

  if v_order.snap_token_expires_at is null or v_order.snap_token_expires_at > now() then
    return jsonb_build_object(
      'status', 'active',
      'order_id', v_order.id,
      'expires_at', v_order.snap_token_expires_at
    );
  end if;

  update public.orders
  set payment_status = 'expire',
      status = 'DIBATALKAN',
      updated_at = now()
  where id = v_order.id
    and payment_status = 'pending';

  v_release := public.release_order_stock_once(v_order.id, 'payment_expired');

  return jsonb_build_object(
    'status', 'expired',
    'order_id', v_order.id,
    'release', v_release
  );
end;
$$;

revoke all on function public.expire_pending_payment_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.expire_pending_payment_order(uuid, uuid) to service_role;

create or replace function public.apply_midtrans_payment_event(
  p_midtrans_order_id text,
  p_event_hash text,
  p_event_type text,
  p_transaction_status text,
  p_fraud_status text,
  p_payment_status text,
  p_order_status text,
  p_transaction_id text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_order public.orders%rowtype;
  v_is_paid boolean := p_payment_status in ('settlement', 'capture');
  v_is_terminal_unpaid boolean := p_payment_status in ('cancel', 'deny', 'expire', 'failure');
  v_current_paid boolean;
  v_stock_taken boolean;
  v_insufficient jsonb;
  v_release jsonb;
begin
  insert into public.payment_events (
    midtrans_order_id,
    event_hash,
    event_type,
    transaction_status,
    fraud_status,
    payload
  ) values (
    p_midtrans_order_id,
    p_event_hash,
    p_event_type,
    p_transaction_status,
    p_fraud_status,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (event_hash) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('status', 'duplicate_event');
  end if;

  select * into v_order
  from public.orders
  where midtrans_order_id = p_midtrans_order_id
  for update;

  if not found then
    update public.payment_events
    set ignored_reason = 'order_not_found'
    where id = v_event_id;
    return jsonb_build_object('status', 'order_not_found');
  end if;

  update public.payment_events
  set order_id = v_order.id
  where id = v_event_id;

  v_current_paid := v_order.payment_status in ('settlement', 'capture')
    or v_order.paid_at is not null;
  v_stock_taken := (v_order.stock_reserved_at is not null or v_order.stock_decremented_at is not null)
    and v_order.stock_released_at is null;

  if v_current_paid and not v_is_paid then
    update public.payment_events
    set ignored_reason = 'non_paid_status_after_paid'
    where id = v_event_id;
    return jsonb_build_object('status', 'ignored_regression', 'order_id', v_order.id);
  end if;

  if v_current_paid and v_is_paid then
    update public.orders
    set payment_status = case
          when payment_status = 'settlement' then 'settlement'
          when p_payment_status = 'settlement' then 'settlement'
          else payment_status
        end,
        midtrans_transaction_id = coalesce(nullif(p_transaction_id, ''), midtrans_transaction_id),
        updated_at = now()
    where id = v_order.id;

    update public.payment_events
    set processed_at = now(),
        ignored_reason = 'already_paid'
    where id = v_event_id;

    return jsonb_build_object('status', 'already_paid', 'order_id', v_order.id);
  end if;

  if v_is_paid and not v_stock_taken then
    select jsonb_agg(jsonb_build_object(
      'product_id', stock.product_id,
      'requested', stock.quantity,
      'available', products.stock
    )) into v_insufficient
    from (
      select order_items.product_id, sum(order_items.quantity)::integer as quantity
      from public.order_items as order_items
      where order_items.order_id = v_order.id
      group by order_items.product_id
    ) as stock
    join public.products as products on products.id = stock.product_id
    where products.stock < stock.quantity;

    if v_insufficient is not null then
      update public.payment_events
      set ignored_reason = 'insufficient_stock'
      where id = v_event_id;
      raise exception 'INSUFFICIENT_STOCK: %', v_insufficient using errcode = 'P0001';
    end if;

    update public.products as products
    set stock = products.stock - stock.quantity,
        updated_at = now()
    from (
      select order_items.product_id, sum(order_items.quantity)::integer as quantity
      from public.order_items as order_items
      where order_items.order_id = v_order.id
      group by order_items.product_id
    ) as stock
    where products.id = stock.product_id;
  end if;

  update public.orders
  set payment_status = case
        when payment_status = 'settlement' then 'settlement'
        when p_payment_status = 'settlement' then 'settlement'
        else p_payment_status
      end,
      status = p_order_status,
      midtrans_transaction_id = coalesce(nullif(p_transaction_id, ''), midtrans_transaction_id),
      paid_at = case when v_is_paid then coalesce(paid_at, now()) else paid_at end,
      stock_decremented_at = case
        when v_is_paid then coalesce(stock_decremented_at, stock_reserved_at, now())
        else stock_decremented_at
      end,
      updated_at = now()
  where id = v_order.id;

  if v_is_terminal_unpaid then
    v_release := public.release_order_stock_once(v_order.id, 'payment_' || p_payment_status);
  end if;

  update public.payment_events
  set processed_at = now()
  where id = v_event_id;

  return jsonb_build_object(
    'status', 'processed',
    'order_id', v_order.id,
    'release', v_release
  );
end;
$$;

revoke all on function public.apply_midtrans_payment_event(text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_midtrans_payment_event(text, text, text, text, text, text, text, text, jsonb) to service_role;

commit;
