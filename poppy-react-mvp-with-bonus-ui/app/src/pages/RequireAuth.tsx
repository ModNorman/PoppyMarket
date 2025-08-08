import React from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSessionStore } from '../lib/store'

export default function RequireAuth({ children, role }: { children: React.ReactNode, role: 'seller'|'admin' }){
  const [loaded, setLoaded] = React.useState(false)
  const { user, profile, setUser, setProfile } = useSessionStore()
  React.useEffect(()=>{
    (async ()=>{
      const { data: { user } } = await supabase.auth.getUser()
      if(!user){ setLoaded(true); return }
      setUser(user as any)
      if(!profile){
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data as any)
      }
      setLoaded(true)
    })()
  }, [])

  if(!loaded) return <div className="p-6">Loading…</div>
  if(!user || !profile) return <Navigate to="/login" />
  if(profile.status !== 'active') return <div className="p-6">Account not active.</div>
  if(profile.role !== role) return <Navigate to={profile.role === 'admin' ? '/admin' : '/seller'} />
  return <>{children}</>
}
