import React from 'react'
import { signIn } from '../api/auth'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../lib/store'

export default function LoginPage(){
  const nav = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(){
    setError(null)
    try {
      await signIn(email, password)
      const { data: { user } } = await supabase.auth.getUser()
      if(!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      useSessionStore.getState().setUser(user as any)
      useSessionStore.getState().setProfile(profile as any)
      if (profile.role === 'admin') nav('/admin'); else nav('/seller')
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input mb-4" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn" onClick={onSubmit}>Sign in</button>
      <div className="mt-4 text-sm text-stone-600">No account? <Link className="underline" to="/register">Register</Link></div>
    </div>
  )
}
