begin;

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  event_type text not null,
  audience text not null default 'customer',
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  html_content text not null,
  text_content text not null,
  payload jsonb not null default '{}'::jsonb,
  order_id uuid references public.orders(id) on delete set null,
  refund_request_id uuid references public.refund_requests(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null default 'brevo',
  provider_message_id text,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error text,
  queued_at timestamptz not null default now(),
  sending_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_events_audience_check check (audience in ('customer', 'admin')),
  constraint email_events_status_check check (status in ('queued', 'sending', 'sent', 'failed', 'skipped')),
  constraint email_events_attempt_count_check check (attempt_count >= 0)
);

create unique index if not exists email_events_dedupe_key_idx
  on public.email_events (dedupe_key);

create index if not exists email_events_order_id_created_at_idx
  on public.email_events (order_id, created_at desc)
  where order_id is not null;

create index if not exists email_events_refund_request_id_created_at_idx
  on public.email_events (refund_request_id, created_at desc)
  where refund_request_id is not null;

create index if not exists email_events_status_queued_at_idx
  on public.email_events (status, queued_at);

alter table public.email_events enable row level security;
revoke all on public.email_events from anon, authenticated;
grant all on public.email_events to service_role;

drop policy if exists email_events_no_client_access on public.email_events;
create policy email_events_no_client_access
  on public.email_events
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

commit;
