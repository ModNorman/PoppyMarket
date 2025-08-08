-- Allow Edge Functions (service_role) to call the RPC
grant execute on function public.aggregate_stats(timestamptz, timestamptz) to service_role;
