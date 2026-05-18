


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "app_private";


ALTER SCHEMA "app_private" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "app_private"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "app_private"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "app_private"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;


ALTER FUNCTION "app_private"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_midtrans_payment_event"("p_midtrans_order_id" "text", "p_event_hash" "text", "p_event_type" "text", "p_transaction_status" "text", "p_fraud_status" "text", "p_payment_status" "text", "p_order_status" "text", "p_transaction_id" "text", "p_payload" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."apply_midtrans_payment_event"("p_midtrans_order_id" "text", "p_event_hash" "text", "p_event_type" "text", "p_transaction_status" "text", "p_fraud_status" "text", "p_payment_status" "text", "p_order_status" "text", "p_transaction_id" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_checkout_order_with_stock_reservation"("p_order_id" "uuid", "p_user_id" "uuid", "p_midtrans_order_id" "text", "p_idempotency_key" "text", "p_cart_fingerprint" "text", "p_address_id" "uuid", "p_address_snapshot" "jsonb", "p_pricing_snapshot" "jsonb", "p_shipping_snapshot" "jsonb", "p_cart_snapshot" "jsonb", "p_items" "jsonb", "p_total_price_raw" bigint, "p_total_price" "text", "p_shipping_cost" bigint, "p_service_fee" bigint, "p_note" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."create_checkout_order_with_stock_reservation"("p_order_id" "uuid", "p_user_id" "uuid", "p_midtrans_order_id" "text", "p_idempotency_key" "text", "p_cart_fingerprint" "text", "p_address_id" "uuid", "p_address_snapshot" "jsonb", "p_pricing_snapshot" "jsonb", "p_shipping_snapshot" "jsonb", "p_cart_snapshot" "jsonb", "p_items" "jsonb", "p_total_price_raw" bigint, "p_total_price" "text", "p_shipping_cost" bigint, "p_service_fee" bigint, "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Get the user's role from profiles
  SELECT role INTO user_role FROM public.profiles WHERE id = (event->>'user_id')::uuid;
  
  claims := event->'claims';
  
  IF user_role IS NOT NULL THEN
    -- Set the role in app_metadata
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{app_metadata,role}', '"user"');
  END IF;
  
  -- Update the claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stock"("p_product_id" bigint, "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."decrement_stock"("p_product_id" bigint, "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_pending_payment_order"("p_order_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."expire_pending_payment_order"("p_order_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "price" "text" NOT NULL,
    "price_raw" bigint NOT NULL,
    "badge" "text" DEFAULT ''::"text",
    "badge_color" "text" DEFAULT ''::"text",
    "badge_width" "text" DEFAULT ''::"text",
    "image" "text" NOT NULL,
    "img_style" "text" DEFAULT ''::"text",
    "description" "text" DEFAULT ''::"text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "stock" integer DEFAULT 0 NOT NULL,
    "weight_kg" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bootstrap_key" "text",
    "pricing_type" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "min_price_raw" bigint,
    "max_price_raw" bigint,
    "purchase_instructions" "text",
    CONSTRAINT "products_custom_amount_range_check" CHECK ((("pricing_type" <> 'custom_amount'::"text") OR (("min_price_raw" IS NOT NULL) AND ("max_price_raw" IS NOT NULL) AND ("min_price_raw" > 0) AND ("max_price_raw" >= "min_price_raw")))),
    CONSTRAINT "products_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['fixed'::"text", 'variant'::"text", 'custom_amount'::"text"]))),
    CONSTRAINT "products_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trending_products"("p_limit" integer DEFAULT 4, "p_now" timestamp with time zone DEFAULT "now"()) RETURNS SETOF "public"."products"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
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
    updated_at
  from candidates
  order by
    sort_group asc,
    trending_score desc,
    latest_paid_at desc nulls last,
    case when sort_group = 1 then updated_at end desc nulls last,
    id asc
  limit (select limit_count from params);
$$;


ALTER FUNCTION "public"."get_trending_products"("p_limit" integer, "p_now" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_order_stock_once"("p_order_id" "uuid", "p_reason" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."release_order_stock_once"("p_order_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" DEFAULT ''::"text",
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "address" "text" NOT NULL,
    "full_address" "text" DEFAULT ''::"text",
    "details" "text" DEFAULT ''::"text",
    "postal_code" "text" DEFAULT ''::"text",
    "country_code" "text" DEFAULT 'JP'::"text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "img" "text" NOT NULL,
    "width" integer DEFAULT 0,
    "height" integer DEFAULT 0,
    "overflow" boolean DEFAULT false,
    "style" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


ALTER TABLE "public"."brands" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."brands_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."email_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dedupe_key" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "audience" "text" DEFAULT 'customer'::"text" NOT NULL,
    "recipient_email" "text" NOT NULL,
    "recipient_name" "text",
    "subject" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "text_content" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "order_id" "uuid",
    "refund_request_id" "uuid",
    "user_id" "uuid",
    "provider" "text" DEFAULT 'brevo'::"text" NOT NULL,
    "provider_message_id" "text",
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "queued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sending_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "skipped_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "email_events_attempt_count_check" CHECK (("attempt_count" >= 0)),
    CONSTRAINT "email_events_audience_check" CHECK (("audience" = ANY (ARRAY['customer'::"text", 'admin'::"text"]))),
    CONSTRAINT "email_events_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sending'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."email_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" bigint NOT NULL,
    "base_currency" "text" NOT NULL,
    "target_currency" "text" NOT NULL,
    "rate" numeric NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


ALTER TABLE "public"."exchange_rates" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."exchange_rates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" bigint NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "quantity" integer NOT NULL,
    "price_raw" bigint NOT NULL,
    "price" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "product_variant_id" bigint,
    "custom_amount_raw" bigint,
    "buyer_note" "text",
    CONSTRAINT "order_items_buyer_note_length_check" CHECK ((("buyer_note" IS NULL) OR ("char_length"("buyer_note") <= 2000))),
    CONSTRAINT "order_items_custom_amount_raw_check" CHECK ((("custom_amount_raw" IS NULL) OR ("custom_amount_raw" > 0))),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


ALTER TABLE "public"."order_items" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."order_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'BARU'::"text" NOT NULL,
    "status_color" "text" DEFAULT ''::"text",
    "total_price_raw" bigint NOT NULL,
    "total_price" "text" DEFAULT ''::"text",
    "payment_method" "text" DEFAULT ''::"text",
    "midtrans_order_id" "text",
    "midtrans_transaction_id" "text" DEFAULT ''::"text",
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_url" "text" DEFAULT ''::"text",
    "tracking_number" "text" DEFAULT ''::"text",
    "estimated_delivery" "text" DEFAULT ''::"text",
    "cancel_reason" "text" DEFAULT ''::"text",
    "note" "text" DEFAULT ''::"text",
    "shipping_cost" bigint DEFAULT 0,
    "service_fee" bigint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "idempotency_key" "text",
    "cart_fingerprint" "text",
    "address_id" "uuid",
    "address_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "pricing_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "shipping_snapshot" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "cart_snapshot" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "snap_token" "text",
    "snap_redirect_url" "text",
    "snap_token_expires_at" timestamp with time zone,
    "stock_decremented_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "stock_reserved_at" timestamp with time zone,
    "stock_released_at" timestamp with time zone,
    "stock_release_reason" "text",
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['PAYMENT_PENDING'::"text", 'PAYMENT_EXPIRED'::"text", 'BARU'::"text", 'DIPROSES'::"text", 'DIKIRIM'::"text", 'SELESAI'::"text", 'DIBATALKAN'::"text", 'CANCEL_REQUESTED'::"text", 'CANCEL_APPROVED'::"text", 'REFUND_INFO_SUBMITTED'::"text", 'REFUNDED'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "midtrans_order_id" "text" NOT NULL,
    "event_hash" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "transaction_status" "text",
    "fraud_status" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "processed_at" timestamp with time zone,
    "ignored_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text",
    "price" "text" NOT NULL,
    "price_raw" bigint NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "weight_kg" numeric,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_variants_price_raw_check" CHECK (("price_raw" > 0)),
    CONSTRAINT "product_variants_stock_check" CHECK (("stock" >= 0)),
    CONSTRAINT "product_variants_weight_kg_check" CHECK ((("weight_kg" IS NULL) OR ("weight_kg" > (0)::numeric)))
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


ALTER TABLE "public"."product_variants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."product_variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text",
    "avatar_url" "text" DEFAULT ''::"text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refund_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "refund_method" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "admin_note" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "initiated_by" "text",
    "initiated_by_user_id" "uuid",
    "previous_order_status" "text",
    "refund_amount" bigint,
    "account_name" "text",
    "payout_provider" "text",
    "seller_reason" "text",
    "buyer_reason" "text",
    "review_note" "text",
    "rejection_reason" "text",
    "transfer_note" "text",
    "reviewed_at" timestamp with time zone,
    "payout_submitted_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "refund_requests_initiated_by_check" CHECK ((("initiated_by" IS NULL) OR ("initiated_by" = ANY (ARRAY['buyer'::"text", 'seller'::"text"])))),
    CONSTRAINT "refund_requests_status_check" CHECK (("status" = ANY (ARRAY['awaiting_seller_review'::"text", 'rejected'::"text", 'cancelled_by_buyer'::"text", 'awaiting_buyer_payout'::"text", 'awaiting_manual_transfer'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."refund_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_settings" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_settings" OWNER TO "postgres";


ALTER TABLE "public"."store_settings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."store_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."addresses"
    ADD CONSTRAINT "addresses_phone_e164_check" CHECK (("phone" ~ '^\+[1-9][0-9]{7,14}$'::"text")) NOT VALID;



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."email_events"
    ADD CONSTRAINT "email_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_base_currency_target_currency_key" UNIQUE ("base_currency", "target_currency");



ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_midtrans_order_id_key" UNIQUE ("midtrans_order_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_event_hash_key" UNIQUE ("event_hash");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_name_key" UNIQUE ("product_id", "name");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_bootstrap_key_key" UNIQUE ("bootstrap_key");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "profiles_phone_e164_check" CHECK ((("phone" IS NULL) OR ("phone" = ''::"text") OR ("phone" ~ '^\+[1-9][0-9]{7,14}$'::"text"))) NOT VALID;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "email_events_dedupe_key_idx" ON "public"."email_events" USING "btree" ("dedupe_key");



CREATE INDEX "email_events_order_id_created_at_idx" ON "public"."email_events" USING "btree" ("order_id", "created_at" DESC) WHERE ("order_id" IS NOT NULL);



CREATE INDEX "email_events_refund_request_id_created_at_idx" ON "public"."email_events" USING "btree" ("refund_request_id", "created_at" DESC) WHERE ("refund_request_id" IS NOT NULL);



CREATE INDEX "email_events_status_queued_at_idx" ON "public"."email_events" USING "btree" ("status", "queued_at");



CREATE INDEX "idx_addresses_user_id" ON "public"."addresses" USING "btree" ("user_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_order_items_product_variant_id" ON "public"."order_items" USING "btree" ("product_variant_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_product_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_pricing_type" ON "public"."products" USING "btree" ("pricing_type");



CREATE INDEX "order_items_product_order_idx" ON "public"."order_items" USING "btree" ("product_id", "order_id");



CREATE INDEX "orders_address_id_idx" ON "public"."orders" USING "btree" ("address_id") WHERE ("address_id" IS NOT NULL);



CREATE INDEX "orders_paid_at_idx" ON "public"."orders" USING "btree" ("paid_at" DESC) WHERE ("paid_at" IS NOT NULL);



CREATE INDEX "orders_pending_payment_expiry_idx" ON "public"."orders" USING "btree" ("snap_token_expires_at") WHERE (("payment_status" = 'pending'::"text") AND ("snap_token_expires_at" IS NOT NULL) AND ("stock_released_at" IS NULL));



CREATE INDEX "orders_status_created_at_idx" ON "public"."orders" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "orders_stock_release_audit_idx" ON "public"."orders" USING "btree" ("stock_released_at" DESC) WHERE ("stock_released_at" IS NOT NULL);



CREATE INDEX "orders_trending_paid_idx" ON "public"."orders" USING "btree" ("paid_at" DESC, "payment_status", "status") WHERE (("paid_at" IS NOT NULL) AND ("payment_status" = ANY (ARRAY['settlement'::"text", 'capture'::"text"])));



CREATE INDEX "orders_user_created_at_idx" ON "public"."orders" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "orders_user_idempotency_key_uidx" ON "public"."orders" USING "btree" ("user_id", "idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "payment_events_midtrans_order_id_idx" ON "public"."payment_events" USING "btree" ("midtrans_order_id", "created_at" DESC);



CREATE INDEX "payment_events_order_id_idx" ON "public"."payment_events" USING "btree" ("order_id", "created_at" DESC);



CREATE UNIQUE INDEX "refund_requests_one_buyer_request_per_order_idx" ON "public"."refund_requests" USING "btree" ("order_id", "user_id") WHERE ("initiated_by" = 'buyer'::"text");



CREATE INDEX "refund_requests_order_id_idx" ON "public"."refund_requests" USING "btree" ("order_id");



CREATE INDEX "refund_requests_order_status_idx" ON "public"."refund_requests" USING "btree" ("order_id", "status");



CREATE INDEX "refund_requests_status_created_at_idx" ON "public"."refund_requests" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "refund_requests_user_id_idx" ON "public"."refund_requests" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_events"
    ADD CONSTRAINT "email_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_events"
    ADD CONSTRAINT "email_events_refund_request_id_fkey" FOREIGN KEY ("refund_request_id") REFERENCES "public"."refund_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_events"
    ADD CONSTRAINT "email_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."refund_requests"
    ADD CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Admins manage product variants" ON "public"."product_variants" TO "authenticated" USING ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = 'admin'::"text")) WITH CHECK ((( SELECT (("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text")) = 'admin'::"text"));



CREATE POLICY "Product variants are publicly readable" ON "public"."product_variants" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "addresses_delete_own_or_admin" ON "public"."addresses" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "addresses_insert_own_or_admin" ON "public"."addresses" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "addresses_select_own_or_admin" ON "public"."addresses" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "addresses_update_own_or_admin" ON "public"."addresses" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"())) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_admin_delete" ON "public"."brands" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "brands_admin_insert" ON "public"."brands" FOR INSERT TO "authenticated" WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "brands_admin_update" ON "public"."brands" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "brands_public_select" ON "public"."brands" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_admin_delete" ON "public"."categories" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "categories_admin_insert" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "categories_admin_update" ON "public"."categories" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "categories_public_select" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."email_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "email_events_no_client_access" ON "public"."email_events" AS RESTRICTIVE TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "exchange_rates_public_select" ON "public"."exchange_rates" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_admin_delete" ON "public"."order_items" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "order_items_admin_update" ON "public"."order_items" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "order_items_insert_own_or_admin" ON "public"."order_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND (("o"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"())))));



CREATE POLICY "order_items_select_own_or_admin" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND (("o"."user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_insert_own_or_admin" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "orders_select_own_or_admin" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "orders_update_own_or_admin" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"())) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_events_no_client_access" ON "public"."payment_events" AS RESTRICTIVE TO "authenticated", "anon" USING (false) WITH CHECK (false);



ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_admin_delete" ON "public"."products" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "products_admin_insert" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "products_admin_update" ON "public"."products" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "products_public_select" ON "public"."products" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_own_or_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "profiles_update_own_or_admin" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"())) WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



ALTER TABLE "public"."refund_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "refund_requests_delete_admin" ON "public"."refund_requests" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "refund_requests_insert_own_or_admin" ON "public"."refund_requests" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "refund_requests_select_own_or_admin" ON "public"."refund_requests" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "app_private"."is_admin"()));



CREATE POLICY "refund_requests_update_admin" ON "public"."refund_requests" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



ALTER TABLE "public"."store_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_settings_admin_delete" ON "public"."store_settings" FOR DELETE TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "store_settings_admin_insert" ON "public"."store_settings" FOR INSERT TO "authenticated" WITH CHECK ("app_private"."is_admin"());



CREATE POLICY "store_settings_admin_select" ON "public"."store_settings" FOR SELECT TO "authenticated" USING ("app_private"."is_admin"());



CREATE POLICY "store_settings_admin_update" ON "public"."store_settings" FOR UPDATE TO "authenticated" USING ("app_private"."is_admin"()) WITH CHECK ("app_private"."is_admin"());



GRANT USAGE ON SCHEMA "app_private" TO "authenticated";
GRANT USAGE ON SCHEMA "app_private" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "app_private"."handle_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "app_private"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "app_private"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "app_private"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_midtrans_payment_event"("p_midtrans_order_id" "text", "p_event_hash" "text", "p_event_type" "text", "p_transaction_status" "text", "p_fraud_status" "text", "p_payment_status" "text", "p_order_status" "text", "p_transaction_id" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_midtrans_payment_event"("p_midtrans_order_id" "text", "p_event_hash" "text", "p_event_type" "text", "p_transaction_status" "text", "p_fraud_status" "text", "p_payment_status" "text", "p_order_status" "text", "p_transaction_id" "text", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_checkout_order_with_stock_reservation"("p_order_id" "uuid", "p_user_id" "uuid", "p_midtrans_order_id" "text", "p_idempotency_key" "text", "p_cart_fingerprint" "text", "p_address_id" "uuid", "p_address_snapshot" "jsonb", "p_pricing_snapshot" "jsonb", "p_shipping_snapshot" "jsonb", "p_cart_snapshot" "jsonb", "p_items" "jsonb", "p_total_price_raw" bigint, "p_total_price" "text", "p_shipping_cost" bigint, "p_service_fee" bigint, "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_checkout_order_with_stock_reservation"("p_order_id" "uuid", "p_user_id" "uuid", "p_midtrans_order_id" "text", "p_idempotency_key" "text", "p_cart_fingerprint" "text", "p_address_id" "uuid", "p_address_snapshot" "jsonb", "p_pricing_snapshot" "jsonb", "p_shipping_snapshot" "jsonb", "p_cart_snapshot" "jsonb", "p_items" "jsonb", "p_total_price_raw" bigint, "p_total_price" "text", "p_shipping_cost" bigint, "p_service_fee" bigint, "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";



REVOKE ALL ON FUNCTION "public"."decrement_stock"("p_product_id" bigint, "p_quantity" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" bigint, "p_quantity" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."expire_pending_payment_order"("p_order_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_pending_payment_order"("p_order_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_trending_products"("p_limit" integer, "p_now" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_trending_products"("p_limit" integer, "p_now" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."release_order_stock_once"("p_order_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_order_stock_once"("p_order_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."email_events" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."exchange_rates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."exchange_rates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."exchange_rates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_events" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_variants_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."refund_requests" TO "anon";
GRANT ALL ON TABLE "public"."refund_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."refund_requests" TO "service_role";



GRANT ALL ON TABLE "public"."store_settings" TO "anon";
GRANT ALL ON TABLE "public"."store_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."store_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
--
-- Auth trigger and Storage baseline additions not included in public/app_private schema dump.
--

DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "app_private"."handle_new_user"();

INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES
  ('avatars', 'avatars', true, NULL, NULL),
  ('product-images', 'product-images', true, NULL, NULL),
  ('site-assets', 'site-assets', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[])
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "public" = EXCLUDED."public",
    "file_size_limit" = EXCLUDED."file_size_limit",
    "allowed_mime_types" = EXCLUDED."allowed_mime_types";

DROP POLICY IF EXISTS "avatars_select_own" ON "storage"."objects";
CREATE POLICY "avatars_select_own" ON "storage"."objects"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("bucket_id" = 'avatars'::text) AND (("storage"."foldername"("name"))[1] = (( SELECT "auth"."uid"() AS "uid"))::text));

DROP POLICY IF EXISTS "avatars_insert_own" ON "storage"."objects";
CREATE POLICY "avatars_insert_own" ON "storage"."objects"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("bucket_id" = 'avatars'::text) AND (("storage"."foldername"("name"))[1] = (( SELECT "auth"."uid"() AS "uid"))::text));

DROP POLICY IF EXISTS "avatars_update_own" ON "storage"."objects";
CREATE POLICY "avatars_update_own" ON "storage"."objects"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("bucket_id" = 'avatars'::text) AND (("storage"."foldername"("name"))[1] = (( SELECT "auth"."uid"() AS "uid"))::text))
  WITH CHECK (("bucket_id" = 'avatars'::text) AND (("storage"."foldername"("name"))[1] = (( SELECT "auth"."uid"() AS "uid"))::text));

DROP POLICY IF EXISTS "avatars_delete_own" ON "storage"."objects";
CREATE POLICY "avatars_delete_own" ON "storage"."objects"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("bucket_id" = 'avatars'::text) AND (("storage"."foldername"("name"))[1] = (( SELECT "auth"."uid"() AS "uid"))::text));

DROP POLICY IF EXISTS "product_images_admin_select" ON "storage"."objects";
CREATE POLICY "product_images_admin_select" ON "storage"."objects"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("bucket_id" = 'product-images'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "product_images_admin_insert" ON "storage"."objects";
CREATE POLICY "product_images_admin_insert" ON "storage"."objects"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("bucket_id" = 'product-images'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "product_images_admin_update" ON "storage"."objects";
CREATE POLICY "product_images_admin_update" ON "storage"."objects"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("bucket_id" = 'product-images'::text) AND "app_private"."is_admin"())
  WITH CHECK (("bucket_id" = 'product-images'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "product_images_admin_delete" ON "storage"."objects";
CREATE POLICY "product_images_admin_delete" ON "storage"."objects"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("bucket_id" = 'product-images'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "site_assets_admin_select" ON "storage"."objects";
CREATE POLICY "site_assets_admin_select" ON "storage"."objects"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING (("bucket_id" = 'site-assets'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "site_assets_admin_insert" ON "storage"."objects";
CREATE POLICY "site_assets_admin_insert" ON "storage"."objects"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK (("bucket_id" = 'site-assets'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "site_assets_admin_update" ON "storage"."objects";
CREATE POLICY "site_assets_admin_update" ON "storage"."objects"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING (("bucket_id" = 'site-assets'::text) AND "app_private"."is_admin"())
  WITH CHECK (("bucket_id" = 'site-assets'::text) AND "app_private"."is_admin"());

DROP POLICY IF EXISTS "site_assets_admin_delete" ON "storage"."objects";
CREATE POLICY "site_assets_admin_delete" ON "storage"."objects"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING (("bucket_id" = 'site-assets'::text) AND "app_private"."is_admin"());

-- Supabase local defaults may grant public function execution before this
-- baseline runs. Revoke them explicitly so fresh installs match live.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM "service_role";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "service_role";
REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "service_role";
REVOKE ALL ON TABLE "public"."email_events", "public"."payment_events" FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

