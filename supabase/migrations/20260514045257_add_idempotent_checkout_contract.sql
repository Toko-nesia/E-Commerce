create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  midtrans_order_id text not null,
  event_hash text not null,
  event_type text not null,
  transaction_status text,
  fraud_status text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  ignored_reason text,
  created_at timestamptz not null default now(),
  unique (event_hash)
);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;
grant all on public.payment_events to service_role;

alter table public.orders
  add column if not exists idempotency_key text,
  add column if not exists cart_fingerprint text,
  add column if not exists address_id uuid references public.addresses(id) on delete set null,
  add column if not exists address_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists pricing_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists shipping_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists cart_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists snap_token text,
  add column if not exists snap_redirect_url text,
  add column if not exists snap_token_expires_at timestamptz,
  add column if not exists stock_decremented_at timestamptz,
  add column if not exists paid_at timestamptz;

create unique index if not exists orders_user_idempotency_key_uidx
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists orders_user_created_at_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists orders_address_id_idx
  on public.orders (address_id)
  where address_id is not null;

create index if not exists orders_paid_at_idx
  on public.orders (paid_at desc)
  where paid_at is not null;

create index if not exists payment_events_order_id_idx
  on public.payment_events (order_id, created_at desc);

create index if not exists payment_events_midtrans_order_id_idx
  on public.payment_events (midtrans_order_id, created_at desc);

create index if not exists refund_requests_order_id_idx
  on public.refund_requests (order_id);

create index if not exists refund_requests_user_id_idx
  on public.refund_requests (user_id);

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
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_order public.orders%rowtype;
  v_is_paid boolean := p_payment_status in ('settlement', 'capture');
  v_current_paid boolean;
  v_insufficient jsonb;
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

  v_current_paid := v_order.stock_decremented_at is not null
    or v_order.payment_status in ('settlement', 'capture');

  if v_current_paid and not v_is_paid then
    update public.payment_events
    set ignored_reason = 'non_paid_status_after_paid'
    where id = v_event_id;
    return jsonb_build_object('status', 'ignored_regression', 'order_id', v_order.id);
  end if;

  if v_is_paid and v_order.stock_decremented_at is null then
    select jsonb_agg(jsonb_build_object(
      'product_id', s.product_id,
      'requested', s.quantity,
      'available', p.stock
    )) into v_insufficient
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id
      group by product_id
    ) s
    join public.products p on p.id = s.product_id
    where p.stock < s.quantity;

    if v_insufficient is not null then
      update public.payment_events
      set ignored_reason = 'insufficient_stock'
      where id = v_event_id;
      raise exception 'INSUFFICIENT_STOCK: %', v_insufficient using errcode = 'P0001';
    end if;

    update public.products p
    set stock = p.stock - s.quantity,
        updated_at = now()
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id
      group by product_id
    ) s
    where p.id = s.product_id;
  end if;

  update public.orders
  set payment_status = case
        when payment_status = 'settlement' then 'settlement'
        when p_payment_status = 'settlement' then 'settlement'
        else p_payment_status
      end,
      status = case
        when v_current_paid and not v_is_paid then status
        else p_order_status
      end,
      midtrans_transaction_id = coalesce(nullif(p_transaction_id, ''), midtrans_transaction_id),
      paid_at = case when v_is_paid then coalesce(paid_at, now()) else paid_at end,
      stock_decremented_at = case when v_is_paid then coalesce(stock_decremented_at, now()) else stock_decremented_at end,
      updated_at = now()
  where id = v_order.id;

  update public.payment_events
  set processed_at = now()
  where id = v_event_id;

  return jsonb_build_object(
    'status', case when v_current_paid and v_is_paid then 'already_paid' else 'processed' end,
    'order_id', v_order.id
  );
end;
$$;

revoke all on function public.apply_midtrans_payment_event(text, text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_midtrans_payment_event(text, text, text, text, text, text, text, text, jsonb) to service_role;

create or replace function public.decrement_stock(p_product_id bigint, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if p_quantity <= 0 then
    raise exception 'Quantity must be positive' using errcode = '22023';
  end if;

  select stock into v_stock
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product % not found', p_product_id using errcode = 'P0002';
  end if;

  if v_stock < p_quantity then
    raise exception 'Insufficient stock for product %', p_product_id using errcode = 'P0001';
  end if;

  update public.products
  set stock = stock - p_quantity,
      updated_at = now()
  where id = p_product_id;
end;
$$;

revoke all on function public.decrement_stock(bigint, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(bigint, integer) to service_role;;
