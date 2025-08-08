import React from 'react'
import { supabase } from '../lib/supabase'
export default function PasswordReset(){
  const [password, setPw] = React.useState('')
  const [msg, setMsg] = React.useState('')
  async function save(){ const { error } = await supabase.auth.updateUser({ password }); setMsg(error? error.message : 'Password updated') }
  return (<div className="max-w-md mx-auto p-6"><h1 className="text-2xl font-semibold mb-2">Reset Password</h1><input className="input mb-3" type="password" placeholder="New password" value={password} onChange={e=>setPw(e.target.value)} /><button className="btn" onClick={save}>Save</button><div className="mt-3 text-stone-600">{msg}</div></div>)}
