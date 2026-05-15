create extension if not exists "pg_net" with schema "public";

CREATE INDEX order_items_product_order_idx ON public.order_items USING btree (product_id, order_id);

CREATE INDEX orders_trending_paid_idx ON public.orders USING btree (paid_at DESC, payment_status, status) WHERE ((paid_at IS NOT NULL) AND (payment_status = ANY (ARRAY['settlement'::text, 'capture'::text])));

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_trending_products(p_limit integer DEFAULT 4, p_now timestamp with time zone DEFAULT now())
 RETURNS SETOF public.products
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$
;


