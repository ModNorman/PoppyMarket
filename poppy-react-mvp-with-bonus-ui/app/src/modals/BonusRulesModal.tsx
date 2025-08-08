import React from 'react'
import { getConfigs } from '../api/bonuses'
import { supabase } from '../lib/supabase'

type Props = { open: boolean, onClose: ()=>void }
export default function BonusRulesModal({ open, onClose }: Props){
  const [cfgs, setCfgs] = React.useState<any[]>([])
  const [updatedAt, setUpdatedAt] = React.useState<string>('')
  React.useEffect(()=>{
    if(!open) return
    (async()=>{
      const data = await getConfigs()
      setCfgs(data||[])
      // derive latest updated_at
      const latest = (data||[]).map((c:any)=> c.updated_at ? new Date(c.updated_at).toISOString() : '').sort().reverse()[0] || ''
      setUpdatedAt(latest)
    })()
  },[open])

  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center p-4 z-50">
      <div className="card bg-white p-5 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Bonus Rules & Targets</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <p className="text-sm text-stone-600 mb-2">Week window: <b>Wednesday → Tuesday</b> (Asia/Manila). Bonuses apply when all thresholds are met.</p>
        <table className="table w-full">
          <thead><tr><th className="p-2 text-left">Cadence</th><th className="p-2 text-left">Min Hours</th><th className="p-2 text-left">Min Branded</th><th className="p-2 text-left">Min Free Size</th><th className="p-2 text-left">Bonus Amount</th></tr></thead>
          <tbody>
            {cfgs.map((c:any)=>(
              <tr key={c.cadence} className="border-b border-stone-200/70">
                <td className="p-2 capitalize">{c.cadence}</td>
                <td className="p-2">{c.min_duration_hours}</td>
                <td className="p-2">{c.min_branded_sold}</td>
                <td className="p-2">{c.min_freesize_sold}</td>
                <td className="p-2">₱{Number(c.bonus_amount||0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-stone-500 mt-3">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</div>
      </div>
    </div>
  )
}
