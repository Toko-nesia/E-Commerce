begin;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status = any (array[
      'PAYMENT_PENDING',
      'PAYMENT_EXPIRED',
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
set status = 'PAYMENT_EXPIRED',
    updated_at = now()
where payment_status = 'expire'
  and paid_at is null
  and status <> 'PAYMENT_EXPIRED';

do $$
declare
  v_order record;
begin
  for v_order in
    select id
    from public.orders
    where payment_status = 'expire'
      and paid_at is null
      and stock_released_at is null
      and (stock_reserved_at is not null or stock_decremented_at is not null)
    for update
  loop
    perform public.release_order_stock_once(v_order.id, 'payment_expired_migration');
  end loop;

  for v_order in
    select id
    from public.orders
    where payment_status = 'pending'
      and paid_at is null
      and snap_token_expires_at is not null
      and snap_token_expires_at <= now()
    for update
  loop
    update public.orders
    set status = 'PAYMENT_EXPIRED',
        payment_status = 'expire',
        updated_at = now()
    where id = v_order.id
      and payment_status = 'pending'
      and paid_at is null;

    perform public.release_order_stock_once(v_order.id, 'payment_expired_migration');
  end loop;
end $$;

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

  if v_order.payment_status = 'expire' or v_order.status = 'PAYMENT_EXPIRED' then
    v_release := public.release_order_stock_once(v_order.id, 'payment_expired');
    return jsonb_build_object(
      'status', 'already_expired',
      'order_id', v_order.id,
      'release', v_release
    );
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
      status = 'PAYMENT_EXPIRED',
      updated_at = now()
  where id = v_order.id
    and payment_status = 'pending'
    and paid_at is null;

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
  v_current_terminal_unpaid boolean;
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
  v_current_terminal_unpaid := v_order.payment_status in ('cancel', 'deny', 'expire', 'failure')
    or (
      v_order.status in ('DIBATALKAN', 'PAYMENT_EXPIRED')
      and v_order.paid_at is null
      and coalesce(v_order.payment_status, '') not in ('settlement', 'capture', 'refund')
    );
  v_stock_taken := (v_order.stock_reserved_at is not null or v_order.stock_decremented_at is not null)
    and v_order.stock_released_at is null;

  if v_current_terminal_unpaid then
    if v_stock_taken then
      v_release := public.release_order_stock_once(v_order.id, 'terminal_unpaid_already_applied');
    end if;

    update public.payment_events
    set ignored_reason = 'terminal_unpaid_already_applied'
    where id = v_event_id;
    return jsonb_build_object('status', 'ignored_terminal_unpaid', 'order_id', v_order.id, 'release', v_release);
  end if;

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
