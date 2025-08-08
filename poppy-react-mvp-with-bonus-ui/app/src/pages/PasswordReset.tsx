import React from 'react'
import { supabase } from '../lib/supabase'

export default function PasswordReset(){
  const [password, setPw] = React.useState('')
  const [msg, setMsg] = React.useState('')
  const [ready, setReady] = React.useState(false)

  React.useEffect(()=>{
    (async ()=>{
      // Handle Supabase recovery link with hash tokens
      // Example: #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token') || ''
      const refresh_token = params.get('refresh_token') || ''
      const type = params.get('type')
      try {
        if (access_token) {
          // If refresh_token is missing, Supabase still accepts setSession with just access_token in v2
          await supabase.auth.setSession({ access_token, refresh_token })
        }
        // Also support code flow just in case
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(window.location.href)
        }
      } catch (e:any) {
        setMsg(e.message || 'Unable to validate reset link. Try requesting a new one.')
      } finally {
        setReady(true)
      }
    })()
  }, [])

  async function save(){
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password })
    setMsg(error? error.message : 'Password updated. You may close this tab and sign in.')
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Reset Password</h1>
      {!ready && <div>Preparing reset…</div>}
      {ready && <>
        <input className="input mb-3" type="password" placeholder="New password" value={password} onChange={e=>setPw(e.target.value)} />
        <button className="btn" onClick={save} disabled={!password}>Save</button>
      </>}
      <div className="mt-3 text-stone-600">{msg}</div>
    </div>
  )
}
