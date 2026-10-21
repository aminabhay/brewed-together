-- Run once in Supabase → SQL Editor.
-- 1) This site's couple. The RSVP form sends customer_id = VITE_SUPABASE_CUSTOMER_ID (here 'brewed-together').
insert into public.customers (id, name)
values ('brewed-together', 'Jyoti & Abhay')
on conflict (id) do nothing;

-- 2) One RSVP per phone number and per email, for each couple.
--    (If this fails, there are already duplicate rows: delete the extras, then run it again.)
create unique index if not exists rsvps_unique_phone_per_customer
  on public.rsvps (customer_id, phone_normalized)
  where phone_normalized is not null;

create unique index if not exists rsvps_unique_email_per_customer
  on public.rsvps (customer_id, email_normalized)
  where email_normalized is not null;

-- 3) The website uses the public anon key, so it may only INSERT (never read) RSVPs.
--    Skip this if your existing RLS policy already allows anon inserts.
alter table public.rsvps enable row level security;
drop policy if exists "anon can submit rsvps" on public.rsvps;
create policy "anon can submit rsvps" on public.rsvps
  for insert to anon
  with check (true);
