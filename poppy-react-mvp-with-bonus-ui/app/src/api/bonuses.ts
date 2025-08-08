import { supabase } from '../lib/supabase'

export async function getConfigs(){
  const { data, error } = await supabase.from('bonus_configs').select('*')
  if (error) throw error
  return data
}
export async function upsertConfig(payload: any){
  const { data, error } = await supabase.from('bonus_configs').upsert(payload).select('*').single()
  if (error) throw error
  return data
}
export async function calculateBonuses(body: any){
  const { data, error } = await supabase.functions.invoke('calculate-bonuses', { body })
  if (error) throw error
  return data
}
export async function aggregateStats(body: any){
  const { data, error } = await supabase.functions.invoke('get-aggregate-stats', { body })
  if (error) throw error
  // RPC may return an array of rows when using RETURNS TABLE; unwrap to first row
  return Array.isArray(data) ? (data[0] || null) : data
}
