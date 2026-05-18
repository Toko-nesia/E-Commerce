begin;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status = any (array[
      'PAYMENT_PENDING',
      'BARU',
      'DIPROSES',
      'DIKIRIM',
      'SELESAI',
      'DIBATALKAN',
      'CANCEL_REQUESTED',
      'CANCEL_APPROVED',
      'REFUND_INFO_SUBMITTED',
      'REFUNDED'
    ]::text[])
  );

update public.orders
set status = 'PAYMENT_PENDING',
    updated_at = now()
where status = 'BARU'
  and payment_status = 'pending'
  and stock_reserved_at is not null
  and stock_released_at is null
  and (snap_token_expires_at is null or snap_token_expires_at > now());

do $$
declare
  v_order record;
begin
  for v_order in
    select id
    from public.orders
    where status = 'BARU'
      and payment_status = 'pending'
      and stock_reserved_at is not null
      and stock_released_at is null
      and snap_token_expires_at is not null
      and snap_token_expires_at <= now()
    for update
  loop
    update public.orders
    set status = 'DIBATALKAN',
        payment_status = 'expire',
        updated_at = now()
    where id = v_order.id
      and payment_status = 'pending';

    perform public.release_order_stock_once(v_order.id, 'payment_expired_migration');
  end loop;
end $$;

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

commit;
