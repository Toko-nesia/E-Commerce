CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id bigint, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(bigint, integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(bigint, integer) FROM authenticated, anon, public;;
