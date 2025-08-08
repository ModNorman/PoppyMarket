-- Initial schema for Poppy Market (timestamped copy for CLI)
-- Sourced from 001_init.sql

-- Extensions
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	role text not null default 'seller',
	status text not null default 'active',
	created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: is_admin() based on profiles (must come after profiles exists)
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
	select exists (
		select 1 from public.profiles p
		where p.id = auth.uid() and p.role = 'admin'
	);
$$;

-- Trigger: Create profile row on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
	insert into public.profiles(id, full_name, role, status)
	values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'seller', 'active')
	on conflict (id) do nothing;
	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- App settings
create table if not exists public.app_settings (
	key text primary key,
	value jsonb not null,
	updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- Bonus configs
create table if not exists public.bonus_configs (
	cadence text primary key,
	min_duration_hours numeric not null default 0,
	min_branded_sold int not null default 0,
	min_freesize_sold int not null default 0,
	bonus_amount numeric not null default 0,
	updated_at timestamptz not null default now()
);
alter table public.bonus_configs enable row level security;

-- Logged sessions
create table if not exists public.logged_sessions (
	id uuid primary key default gen_random_uuid(),
	seller_id uuid not null references public.profiles(id) on delete cascade,
	start_time timestamptz not null,
	end_time timestamptz not null,
	duration_minutes int not null default 0,
	branded_sold int not null default 0,
	free_size_sold int not null default 0,
	created_at timestamptz not null default now()
);

create or replace function public.set_duration_minutes()
returns trigger language plpgsql as $$
begin
	if new.start_time is not null and new.end_time is not null then
		new.duration_minutes := greatest(0, floor(extract(epoch from (new.end_time - new.start_time))/60)::int);
	end if;
	return new;
end;$$;

drop trigger if exists trg_set_duration on public.logged_sessions;
create trigger trg_set_duration before insert or update on public.logged_sessions
for each row execute function public.set_duration_minutes();

alter table public.logged_sessions enable row level security;

-- Payout runs
create table if not exists public.payout_runs (
	id uuid primary key default gen_random_uuid(),
	seller_id uuid not null references public.profiles(id) on delete cascade,
	start_date date not null,
	end_date date not null,
	total_base numeric not null default 0,
	total_daily_bonus numeric not null default 0,
	total_weekly_bonus numeric not null default 0,
	total_monthly_bonus numeric not null default 0,
	total_payout numeric not null default 0,
	status text not null default 'draft',
	created_at timestamptz not null default now(),
	approved_at timestamptz,
	paid_at timestamptz,
	constraint unique_run unique (seller_id, start_date, end_date)
);
alter table public.payout_runs enable row level security;

-- Payout items
create table if not exists public.payout_items (
	id uuid primary key default gen_random_uuid(),
	payout_run_id uuid not null references public.payout_runs(id) on delete cascade,
	log_id uuid not null references public.logged_sessions(id) on delete cascade,
	payout_base numeric not null default 0,
	payout_daily_bonus numeric not null default 0,
	payout_weekly_bonus numeric not null default 0,
	payout_monthly_bonus numeric not null default 0,
	payout_total numeric not null default 0,
	constraint unique_run_log unique (payout_run_id, log_id)
);
alter table public.payout_items enable row level security;

-- RPC for aggregate stats
create or replace function public.aggregate_stats(p_start timestamptz, p_end timestamptz)
returns table (
	total_branded_sold int,
	total_freesize_sold int,
	total_base_pay numeric,
	total_daily_bonus numeric,
	total_weekly_bonus numeric,
	total_monthly_bonus numeric,
	final_total_payout numeric
)
language sql security definer set search_path = public as $$
	with logs as (
		select * from public.logged_sessions
		where start_time >= p_start and end_time <= p_end
	),
	base_cfg as (
		select coalesce((value->>'type')::text, 'per_session') as pay_type,
					 coalesce((value->>'amount')::numeric, 0) as amount
		from public.app_settings where key = 'base_pay'
	),
	base_pay as (
		select case when (select pay_type from base_cfg) = 'per_hour'
						then coalesce(sum((duration_minutes::numeric/60.0) * (select amount from base_cfg)), 0)
						else coalesce(count(*) * (select amount from base_cfg), 0) end as total
		from logs
	),
	payout as (
		select coalesce(sum(total_daily_bonus),0) as daily,
					 coalesce(sum(total_weekly_bonus),0) as weekly,
					 coalesce(sum(total_monthly_bonus),0) as monthly,
					 coalesce(sum(total_payout),0) as final
		from public.payout_runs
		where start_date >= p_start::date and end_date <= p_end::date
	)
	select
		coalesce((select sum(branded_sold) from logs), 0)::int,
		coalesce((select sum(free_size_sold) from logs), 0)::int,
		coalesce((select total from base_pay), 0),
		(select daily from payout),
		(select weekly from payout),
		(select monthly from payout),
		(select final from payout);
$$;

revoke all on function public.aggregate_stats(timestamptz, timestamptz) from public;
grant execute on function public.aggregate_stats(timestamptz, timestamptz) to authenticated;

-- Seeds
insert into public.app_settings(key, value)
values ('base_pay', jsonb_build_object('type','per_hour','amount', 60))
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.bonus_configs(cadence, min_duration_hours, min_branded_sold, min_freesize_sold, bonus_amount)
values
	('daily',   4, 10, 5,  100),
	('weekly', 20, 60, 30, 500),
	('monthly', 80, 250, 120, 2000)
on conflict (cadence) do update set
	min_duration_hours = excluded.min_duration_hours,
	min_branded_sold   = excluded.min_branded_sold,
	min_freesize_sold  = excluded.min_freesize_sold,
	bonus_amount       = excluded.bonus_amount,
	updated_at         = now();
