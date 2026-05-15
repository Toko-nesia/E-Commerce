do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'payment_events'
      and policyname = 'payment_events_no_client_access'
  ) then
    create policy payment_events_no_client_access
      on public.payment_events
      as restrictive
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end $$;;
