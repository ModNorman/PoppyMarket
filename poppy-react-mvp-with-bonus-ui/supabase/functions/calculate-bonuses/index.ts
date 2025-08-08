// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function makeCorsHeaders(req: Request){
  const origin = req.headers.get('Origin') || req.headers.get('origin') || '*'
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  }
}

function toHours(mins: number){ return (mins||0)/60.0 }

function groupBy<T>(arr: T[], key: (t:T)=>string){
  const m = new Map<string, T[]>()
  for(const a of arr){ const k = key(a); m.set(k, [...(m.get(k)||[]), a]) }
  return m
}

serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceKey;

  const supabase = createClient(url, serviceKey);
  // Auth: accept either a user JWT or the service role key (internal)
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  const token = authHeader.replace(/^[Bb]earer\s+/,'');

  let isAdmin = false;
  let userId: string | null = null;
  if (token === serviceKey) {
    // Internal service call: treat as admin
    isAdmin = true;
  } else {
    const supabaseAuth = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    userId = userData.user.id;
    // check profile role
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    isAdmin = prof?.role === 'admin';
  }

  const { startDate, endDate, sellerId } = await req.json();
  if (!startDate || !endDate || !sellerId) return new Response(JSON.stringify({ error: "startDate, endDate, sellerId required" }), { status: 400, headers: corsHeaders });
  if (!isAdmin && userId && sellerId !== userId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

  // load configs
  const { data: cfgs } = await supabase.from("bonus_configs").select("*");
  const dailyCfg = cfgs?.find(c=>c.cadence==='daily')
  const weeklyCfg = cfgs?.find(c=>c.cadence==='weekly')
  const monthlyCfg = cfgs?.find(c=>c.cadence==='monthly')
  const { data: baseCfg } = await supabase.from("app_settings").select("value").eq("key","base_pay").single();

  // query logs in range
  const { data: logs, error } = await supabase
    .from("logged_sessions")
    .select("start_time,end_time,duration_minutes,branded_sold,free_size_sold")
    .eq("seller_id", sellerId)
    .gte("start_time", startDate)
    .lte("end_time", endDate);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });

  let basePay = 0
  const totalHours = (logs||[]).reduce((s,l)=> s + toHours(l.duration_minutes), 0)
  if (baseCfg?.value?.type === 'per_hour') {
    basePay = totalHours * (Number(baseCfg.value.amount)||0)
  } else {
    basePay = (logs?.length || 0) * (Number(baseCfg?.value?.amount)||0)
  }

  // Daily bonus: per PHT date
  let dailyBonus = 0
  if (dailyCfg){
    const byDay = groupBy(logs||[], (l:any)=> new Date(l.start_time).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }))
    for (const [_day, items] of byDay.entries()){
      const h = items.reduce((s:any,l:any)=> s + toHours(l.duration_minutes), 0)
      const b = items.reduce((s:any,l:any)=> s + (l.branded_sold||0), 0)
      const f = items.reduce((s:any,l:any)=> s + (l.free_size_sold||0), 0)
      if (h >= Number(dailyCfg.min_duration_hours||0) && b >= Number(dailyCfg.min_branded_sold||0) && f >= Number(dailyCfg.min_freesize_sold||0)){
        dailyBonus += Number(dailyCfg.bonus_amount||0)
      }
    }
  }

  // Weekly bonus: split into Wed→Tue windows covered by range
  let weeklyBonus = 0
  if (weeklyCfg){
    const start = new Date(startDate)
    const end = new Date(endDate)
    // compute first window start (Wed anchor)
    function startOfWedWeek(d: Date){ const dow = d.getDay(); const off = ((dow + 4) % 7); const s = new Date(d); s.setDate(d.getDate()-off); s.setHours(0,0,0,0); return s }
    for(let wStart = startOfWedWeek(start); wStart <= end; ){
      const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate()+6); wEnd.setHours(23,59,59,999)
      const items = (logs||[]).filter((l:any)=> new Date(l.start_time) >= wStart && new Date(l.end_time) <= wEnd)
      const h = items.reduce((s:any,l:any)=> s + toHours(l.duration_minutes), 0)
      const b = items.reduce((s:any,l:any)=> s + (l.branded_sold||0), 0)
      const f = items.reduce((s:any,l:any)=> s + (l.free_size_sold||0), 0)
      if (h >= Number(weeklyCfg.min_duration_hours||0) && b >= Number(weeklyCfg.min_branded_sold||0) && f >= Number(weeklyCfg.min_freesize_sold||0)){
        weeklyBonus += Number(weeklyCfg.bonus_amount||0)
      }
      // next week
      const next = new Date(wStart); next.setDate(next.getDate()+7); wStart = next
    }
  }

  // Monthly bonus: per calendar month (PHT)
  let monthlyBonus = 0
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
        monthlyBonus += Number(monthlyCfg.bonus_amount||0)
      }
    }
  }

  const totalPayout = basePay + dailyBonus + weeklyBonus + monthlyBonus

  // UI expects some labelled stats for branded/freeSize too
  const branded = (logs||[]).reduce((s,l)=> s + (l.branded_sold||0), 0)
  const freeSize = (logs||[]).reduce((s,l)=> s + (l.free_size_sold||0), 0)

  return new Response(JSON.stringify({ branded, freeSize, basePay, dailyBonus, weeklyBonus, monthlyBonus, totalPayout }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
