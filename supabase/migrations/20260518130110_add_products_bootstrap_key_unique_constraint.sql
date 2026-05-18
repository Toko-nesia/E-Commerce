drop index if exists public.idx_products_bootstrap_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_bootstrap_key_key'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_bootstrap_key_key unique (bootstrap_key);
  end if;
end $$;
