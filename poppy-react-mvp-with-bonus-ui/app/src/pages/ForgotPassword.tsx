import React from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function ForgotPassword(){
  const [email, setEmail] = React.useState('')
  const [msg, setMsg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(){
    setError(null); setMsg(null); setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/password-reset`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setMsg('Check your email for a password reset link.')
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
      {msg && <div className="text-green-700 mb-2">{msg}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input className="input mb-4" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn" onClick={onSubmit} disabled={loading || !email}>Send reset link</button>
      <div className="mt-4 text-sm text-stone-600">
        Remembered your password? <Link className="underline" to="/login">Sign in</Link>
      </div>
    </div>
  )
}
