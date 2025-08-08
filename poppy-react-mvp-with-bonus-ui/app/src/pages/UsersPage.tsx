import React from 'react'
import { listUsers } from '../api/profiles'

export default function UsersPage(){
  const [rows, setRows] = React.useState<any[]>([])
  React.useEffect(()=>{ (async()=>{ setRows(await listUsers()) })() }, [])
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      <table className="table">
        <thead><tr><th className="text-left p-2">Name</th><th className="text-left p-2">Role</th><th className="text-left p-2">Status</th></tr></thead>
        <tbody>
          {rows.map(r=> (<tr key={r.id} className="border-b border-stone-200/70"><td className="p-2">{r.full_name||r.email}</td><td className="p-2">{r.role}</td><td className="p-2">{r.status}</td></tr>))}
        </tbody>
      </table>
    </div>
  )
}
