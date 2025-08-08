-- Ensure Edge Functions (service_role) can execute the RPC
grant execute on function public.aggregate_stats(timestamptz, timestamptz) to service_role;
