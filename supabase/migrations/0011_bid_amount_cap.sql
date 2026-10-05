-- Nothing stopped a bid amount from being an absurd number (e.g. 1e37),
-- which broke the Auction page layout by overflowing the bid display.
-- Cap bids at a sane ceiling well above any realistic lot price.

-- NOT VALID: enforces the cap on every new insert/update without scanning
-- (or failing on) the handful of pre-existing out-of-range rows.
alter table public.bids
  add constraint bids_amount_range
  check (amount > 0 and amount <= 100000000) not valid;
