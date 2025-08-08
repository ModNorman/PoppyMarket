-- Additional grants for Edge Functions
grant execute on function public.aggregate_stats(timestamptz, timestamptz) to service_role;
