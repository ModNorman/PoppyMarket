// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ORIGIN_ALLOWLIST") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
  "Cache-Control": "no-store"
};

function toHours(mins: number){ return (mins||0)/60.0 }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { sellerId, startDate, endDate, dryRun } = await req.json();

  // Load configs and logs (reuse calc-bonuses logic ideally; inline here for brevity)
  const { data: cfgs } = await supabase.from("bonus_configs").select("*");
  const dailyCfg = cfgs?.find(c=>c.cadence==='daily')
  const weeklyCfg = cfgs?.find(c=>c.cadence==='weekly')
  const monthlyCfg = cfgs?.find(c=>c.cadence==='monthly')
  const { data: baseCfg } = await supabase.from("app_settings").select("value").eq("key","base_pay").single();
  const { data: logs, error } = await supabase
    .from("logged_sessions")
    .select("id,start_time,end_time,duration_minutes,branded_sold,free_size_sold")
    .eq("seller_id", sellerId)
    .gte("start_time", startDate)
    .lte("end_time", endDate);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

  // Base pay
  const totalHours = (logs||[]).reduce((s,l)=> s + toHours(l.duration_minutes), 0)
  let total_base = 0
  if (baseCfg?.value?.type === 'per_hour') total_base = totalHours * (Number(baseCfg.value.amount)||0);
  else total_base = (logs?.length||0) * (Number(baseCfg?.value?.amount)||0);

  // Daily bonus per day
  function groupBy<T>(arr: T[], key: (t:T)=>string){ const m = new Map<string, T[]>(); for(const a of arr){ const k = key(a); m.set(k, [...(m.get(k)||[]), a]) } return m }
  let total_daily_bonus = 0
  if (dailyCfg){
    const byDay = groupBy(logs||[], (l:any)=> new Date(l.start_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }))
    for (const [_d, items] of byDay.entries()){
      const h = items.reduce((s:any,l:any)=> s + toHours(l.duration_minutes), 0)
      const b = items.reduce((s:any,l:any)=> s + (l.branded_sold||0), 0)
      const f = items.reduce((s:any,l:any)=> s + (l.free_size_sold||0), 0)
      if (h >= Number(dailyCfg.min_duration_hours||0) && b >= Number(dailyCfg.min_branded_sold||0) && f >= Number(dailyCfg.min_freesize_sold||0)){
        total_daily_bonus += Number(dailyCfg.bonus_amount||0)
      }
    }
  }

  // Weekly bonus across Wed→Tue windows
  let total_weekly_bonus = 0
  if (weeklyCfg){
    function startOfWedWeek(d: Date){ const dow = d.getDay(); const off = ((dow + 4) % 7); const s = new Date(d); s.setDate(d.getDate()-off); s.setHours(0,0,0,0); return s }
    const start = new Date(startDate); const end = new Date(endDate)
    for(let wStart = startOfWedWeek(start); wStart <= end; ){ const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate()+6); wEnd.setHours(23,59,59,999)
      const items = (logs||[]).filter((l:any)=> new Date(l.start_time) >= wStart && new Date(l.end_time) <= wEnd)
      const h = items.reduce((s:any,l:any)=> s + toHours(l.duration_minutes), 0)
      const b = items.reduce((s:any,l:any)=> s + (l.branded_sold||0), 0)
      const f = items.reduce((s:any,l:any)=> s + (l.free_size_sold||0), 0)
      if (h >= Number(weeklyCfg.min_duration_hours||0) && b >= Number(weeklyCfg.min_branded_sold||0) && f >= Number(weeklyCfg.min_freesize_sold||0)){
        total_weekly_bonus += Number(weeklyCfg.bonus_amount||0)
      }
      const next = new Date(wStart); next.setDate(next.getDate()+7); wStart = next
    }
  }

  // Monthly bonus per calendar month
  let total_monthly_bonus = 0
  if (monthlyCfg){
    const byMonth = groupBy(logs||[], (l:any)=> {
      const d = new Date(l.start_time)
      const y = d.toLocaleString('en-CA', { year: 'numeric', timeZone: 'Asia/Manila' })
      const m = d.toLocaleString('en-CA', { month: '2-digit', timeZone: 'Asia/Manila' })
      return `${y}-${m}`
    })
    for (const [_m, items] of byMonth.entries()){
      const h = items.reduce((s:any,l:any)=> s + toHours(l.duration_minutes), 0)
      const b = items.reduce((s:any,l:any)=> s + (l.branded_sold||0), 0)
      const f = items.reduce((s:any,l:any)=> s + (l.free_size_sold||0), 0)
      if (h >= Number(monthlyCfg.min_duration_hours||0) && b >= Number(monthlyCfg.min_branded_sold||0) && f >= Number(monthlyCfg.min_freesize_sold||0)){
        total_monthly_bonus += Number(monthlyCfg.bonus_amount||0)
      }
    }
  }

  const totals = { total_base, total_daily_bonus, total_weekly_bonus, total_monthly_bonus, total_payout: total_base + total_daily_bonus + total_weekly_bonus + total_monthly_bonus }

  if (dryRun) return new Response(JSON.stringify({ totals, items: [], dryRun: true }), { headers: corsHeaders });

  // Idempotent create payout_run
  const { data: existing } = await supabase.from('payout_runs').select('id').eq('seller_id', sellerId).eq('start_date', startDate).eq('end_date', endDate).maybeSingle()
  let runId: string | null = existing?.id || null
  if (!runId){
    const { data: run, error: runErr } = await supabase.from('payout_runs').insert({ seller_id: sellerId, start_date: startDate, end_date: endDate, ...totals }).select('id').single()
    if (runErr) return new Response(JSON.stringify({ error: runErr.message }), { status: 400, headers: corsHeaders });
    runId = run.id
  }

  // Snapshot items with proportional distribution of bonuses by duration weight
  const totalMins = (logs||[]).reduce((s,l)=> s + (l.duration_minutes||0), 0) || 1
  const items = (logs||[]).map((l:any)=>{
    const weight = (l.duration_minutes||0)/totalMins
    const payout_base = (baseCfg?.value?.type === 'per_hour') ? toHours(l.duration_minutes) * (Number(baseCfg.value.amount)||0) : (Number(baseCfg?.value?.amount)||0)
    const payout_daily_bonus = totals.total_daily_bonus * weight
    const payout_weekly_bonus = totals.total_weekly_bonus * weight
    const payout_monthly_bonus = totals.total_monthly_bonus * weight
    const payout_total = payout_base + payout_daily_bonus + payout_weekly_bonus + payout_monthly_bonus
    return { log_id: l.id, payout_base, payout_daily_bonus, payout_weekly_bonus, payout_monthly_bonus, payout_total }
  })

  if (items.length){
    // Upsert safeguard using unique(payout_run_id, log_id)
    const lines = items.map(i => ({ payout_run_id: runId, ...i }))
    const { error: itemErr } = await supabase.from('payout_items').insert(lines).select('id')
    if (itemErr && !String(itemErr.message).includes('duplicate')){
      return new Response(JSON.stringify({ error: itemErr.message }), { status: 400, headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ runId, totals, itemsCount: items.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
