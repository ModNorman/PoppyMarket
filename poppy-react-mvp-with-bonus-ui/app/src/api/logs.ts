import { supabase } from '../lib/supabase'

export async function listLogs(params: { start: string, end: string, sellerId?: string }){
  let q = supabase.from('logged_sessions').select('*').gte('start_time', params.start).lte('end_time', params.end).order('start_time', { ascending: false })
  if (params.sellerId) q = q.eq('seller_id', params.sellerId)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createLog(payload: any){
  const { data, error } = await supabase.from('logged_sessions').insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function updateLog(id: string, payload: any){
  const { data, error } = await supabase.from('logged_sessions').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}
