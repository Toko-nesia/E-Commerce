begin;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status = any (array[
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

alter table public.refund_requests drop constraint if exists refund_requests_status_check;

alter table public.refund_requests
  add column if not exists initiated_by text,
  add column if not exists initiated_by_user_id uuid references public.profiles(id),
  add column if not exists previous_order_status text,
  add column if not exists refund_amount bigint,
  add column if not exists account_name text,
  add column if not exists payout_provider text,
  add column if not exists seller_reason text,
  add column if not exists buyer_reason text,
  add column if not exists review_note text,
  add column if not exists rejection_reason text,
  add column if not exists transfer_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists payout_submitted_at timestamptz,
  add column if not exists refunded_at timestamptz;

update public.refund_requests as refund_requests
set
  status = case refund_requests.status
    when 'pending' then 'awaiting_seller_review'
    when 'approved' then 'awaiting_manual_transfer'
    when 'rejected' then 'rejected'
    else refund_requests.status
  end,
  initiated_by = coalesce(refund_requests.initiated_by, 'buyer'),
  initiated_by_user_id = coalesce(refund_requests.initiated_by_user_id, refund_requests.user_id),
  buyer_reason = coalesce(refund_requests.buyer_reason, refund_requests.reason),
  refund_amount = coalesce(refund_requests.refund_amount, orders.total_price_raw),
  previous_order_status = coalesce(refund_requests.previous_order_status, orders.status)
from public.orders
where refund_requests.order_id = orders.id;

alter table public.refund_requests
  add constraint refund_requests_status_check check (
    status = any (array[
      'awaiting_seller_review',
      'rejected',
      'awaiting_buyer_payout',
      'awaiting_manual_transfer',
      'refunded'
    ]::text[])
  );

alter table public.refund_requests drop constraint if exists refund_requests_initiated_by_check;
alter table public.refund_requests
  add constraint refund_requests_initiated_by_check check (
    initiated_by is null or initiated_by in ('buyer', 'seller')
  );

create index if not exists refund_requests_status_created_at_idx
  on public.refund_requests (status, created_at desc);

create index if not exists refund_requests_order_status_idx
  on public.refund_requests (order_id, status);

alter table public.profiles drop constraint if exists profiles_phone_e164_check;
alter table public.profiles
  add constraint profiles_phone_e164_check
  check (phone is null or phone = '' or phone ~ '^\+[1-9][0-9]{7,14}$')
  not valid;

alter table public.addresses drop constraint if exists addresses_phone_e164_check;
alter table public.addresses
  add constraint addresses_phone_e164_check
  check (phone ~ '^\+[1-9][0-9]{7,14}$')
  not valid;

commit;
