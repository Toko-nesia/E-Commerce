begin;

alter table public.refund_requests
  add column if not exists cancelled_at timestamptz;

alter table public.refund_requests drop constraint if exists refund_requests_status_check;
alter table public.refund_requests
  add constraint refund_requests_status_check check (
    status = any (array[
      'awaiting_seller_review',
      'rejected',
      'cancelled_by_buyer',
      'awaiting_buyer_payout',
      'awaiting_manual_transfer',
      'refunded'
    ]::text[])
  );

create unique index if not exists refund_requests_one_buyer_request_per_order_idx
  on public.refund_requests (order_id, user_id)
  where initiated_by = 'buyer';

commit;
