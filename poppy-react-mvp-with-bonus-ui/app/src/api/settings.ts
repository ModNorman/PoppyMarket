import { supabase } from '../lib/supabase'
export async function getSettings(){
  const { data, error } = await supabase.from('app_settings').select('*')
  if (error) throw error
  return data
}
