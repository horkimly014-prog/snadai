-- Lower the bid cap from $100,000,000 to $99,000,000.
alter table public.bids
  drop constraint bids_amount_range;

alter table public.bids
  add constraint bids_amount_range
  check (amount > 0 and amount <= 99000000) not valid;
