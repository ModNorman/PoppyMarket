import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../lib/store'
import { signOut } from '../api/auth'
import ProfileModal from '../modals/ProfileModal'

export default function Navbar(){
  const nav = useNavigate()
  const { user, profile } = useSessionStore()
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  async function handleLogout(){
    await signOut()
    nav('/login')
  }

  return (
    <div className="w-full border-b bg-white/70 backdrop-blur">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to={profile?.role === 'admin' ? '/admin' : '/seller'} className="font-semibold">Poppy Market</Link>
          {profile?.role === 'admin' && (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <Link className="hover:underline" to="/admin">Dashboard</Link>
              <Link className="hover:underline" to="/admin/users">Users</Link>
              <Link className="hover:underline" to="/admin/payouts">Payouts</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button className="sm:hidden btn" onClick={()=> setMenuOpen(v=>!v)}>Menu</button>
          <span className="hidden sm:inline text-gray-600">{user?.email} · {profile?.role}</span>
          <button className="btn" onClick={()=> setProfileOpen(true)}>My Profile</button>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      {menuOpen && profile?.role==='admin' && (
        <div className="sm:hidden container mx-auto px-4 pb-3 text-sm flex gap-3">
          <Link className="underline" to="/admin" onClick={()=>setMenuOpen(false)}>Dashboard</Link>
          <Link className="underline" to="/admin/users" onClick={()=>setMenuOpen(false)}>Users</Link>
          <Link className="underline" to="/admin/payouts" onClick={()=>setMenuOpen(false)}>Payouts</Link>
        </div>
      )}
      <ProfileModal open={profileOpen} onClose={()=> setProfileOpen(false)} initial={{ full_name: profile?.full_name }} />
    </div>
  )
}
