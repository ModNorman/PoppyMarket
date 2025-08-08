import { supabase } from '../lib/supabase'

export async function getMyProfile(){
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) throw new Error('No user')
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw error
  return data
}
export async function listUsers(){
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
