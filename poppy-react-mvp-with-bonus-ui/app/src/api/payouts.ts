import { supabase } from '../lib/supabase'

export async function generateRun(body: any){
  const { data, error } = await supabase.functions.invoke('payout-generate-run', { body })
  if (error) throw error
  return data
}

export async function listRuns(params: { start?: string, end?: string, sellerId?: string }){
  let q = supabase.from('payout_runs').select('*').order('start_date', { ascending: false })
  if (params.start) q = q.gte('start_date', params.start)
  if (params.end) q = q.lte('end_date', params.end)
  if (params.sellerId) q = q.eq('seller_id', params.sellerId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function updateRunStatus(runId: string, status: 'draft'|'approved'|'paid'){
  const patch: any = { status }
  const now = new Date().toISOString()
  if (status === 'approved') patch.approved_at = now
  if (status === 'paid') patch.paid_at = now
  const { data, error } = await supabase.from('payout_runs').update(patch).eq('id', runId).select('*').single()
  if (error) throw error
  return data
}
