import React from 'react'
import { supabase } from '../lib/supabase'

type Props = { open: boolean, onClose: ()=>void, initial?: { full_name?: string } }
export default function ProfileModal({ open, onClose, initial }: Props){
  const [fullName, setFullName] = React.useState(initial?.full_name || '')
  const [newPw, setNewPw] = React.useState('')
  const [confirmPw, setConfirmPw] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(()=>{ if(initial){ setFullName(initial.full_name||'') } }, [initial])

  if(!open) return null

  async function save(){
    setErr(null); setMsg(null); setSaving(true)
    try{
      const { data: { user } } = await supabase.auth.getUser(); if(!user) throw new Error('Not signed in')
      if (fullName){ await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id) }
      if (newPw){
        if (newPw !== confirmPw) throw new Error('Passwords do not match')
        if (newPw.length < 8) throw new Error('Password must be at least 8 characters')
        const { error } = await supabase.auth.updateUser({ password: newPw }); if (error) throw error
      }
      setMsg('Saved')
      setTimeout(onClose, 800)
    } catch(e:any){ setErr(e.message) }
    finally{ setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50">
      <div className="card bg-white p-5 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">My Profile</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
        {msg && <div className="text-green-700 text-sm mb-2">{msg}</div>}
        <div className="grid gap-3">
          <input className="input" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
          <hr className="my-1"/>
          <input className="input" type="password" placeholder="New password" value={newPw} onChange={e=>setNewPw(e.target.value)} />
          <input className="input" type="password" placeholder="Confirm password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
          <div className="flex justify-end">
            <button className="btn" disabled={saving} onClick={save}>{saving? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
