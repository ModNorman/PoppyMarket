-- Promote admin and seed a sample session for test seller by email (idempotent)

-- Promote admin if the user exists
update public.profiles p
set role = 'admin'
from auth.users u
where u.email = 'normanarisdeocareza@gmail.com'
  and p.id = u.id
  and p.role <> 'admin';

-- Ensure both users are marked active if they exist
update public.profiles p
set status = 'active'
from auth.users u
where u.email in ('normanarisdeocareza@gmail.com', 'on.wazir@gmail.com')
  and p.id = u.id
  and p.status <> 'active';

-- Seed exactly one sample logged session for the test seller (only if user exists and has no logs yet)
insert into public.logged_sessions (seller_id, start_time, end_time, branded_sold, free_size_sold)
select u.id,
       timezone('UTC', now()) - interval '2 hours',
       timezone('UTC', now()),
       12,
       6
from auth.users u
where u.email = 'on.wazir@gmail.com'
  and not exists (
    select 1 from public.logged_sessions ls where ls.seller_id = u.id
  );
