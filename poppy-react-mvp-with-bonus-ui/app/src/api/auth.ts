import { supabase } from '../lib/supabase'
import { useSessionStore } from '../lib/store'

export async function signIn(email: string, password: string){
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
export async function signUp(email: string, password: string, full_name: string){
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  if (error) throw error
  return data
}
export async function signOut(){
  await supabase.auth.signOut()
  useSessionStore.getState().setUser(null)
  useSessionStore.getState().setProfile(null)
}
export async function getSession(){
  const { data } = await supabase.auth.getSession()
  return data.session
}
