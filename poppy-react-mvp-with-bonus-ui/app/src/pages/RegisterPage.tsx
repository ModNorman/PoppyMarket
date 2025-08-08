import React from 'react'
import { signUp } from '../api/auth'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage(){
  const nav = useNavigate()
  const [full_name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [msg, setMsg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(){
    setError(null)
    try {
      if (!full_name) throw new Error('Full name is required')
      if (!/.+@.+\..+/.test(email)) throw new Error('Enter a valid email')
      if (password.length < 8) throw new Error('Password must be at least 8 characters')
      setLoading(true)
      await signUp(email, password, full_name)
      setMsg('Check your email to verify your account.')
      setTimeout(()=> nav('/login'), 1500)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Register</h1>
      {msg && <div className="text-green-700 mb-2">{msg}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input className="input mb-2" placeholder="Full name" value={full_name} onChange={e=>setName(e.target.value)} />
      <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input mb-4" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
  <button className="btn" disabled={!full_name || !email || password.length<8 || loading} onClick={onSubmit}>{loading? 'Creating…' : 'Create account'}</button>
      <div className="mt-4 text-sm text-stone-600">Have an account? <Link className="underline" to="/login">Sign in</Link></div>
    </div>
  )
}
