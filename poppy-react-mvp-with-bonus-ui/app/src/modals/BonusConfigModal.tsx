import React from 'react'

type Props = { open: boolean, initial?: any, onClose: ()=>void, onSave: (payload:any)=>void }
export default function BonusConfigModal({ open, initial, onClose, onSave }: Props){
  const [cadence, setCadence] = React.useState(initial?.cadence || 'daily')
  const [min_duration_hours, setHrs] = React.useState(initial?.min_duration_hours || 0)
  const [min_branded_sold, setB] = React.useState(initial?.min_branded_sold || 0)
  const [min_freesize_sold, setF] = React.useState(initial?.min_freesize_sold || 0)
  const [bonus_amount, setAmt] = React.useState(initial?.bonus_amount || 0)
  React.useEffect(()=>{ if(initial){ setCadence(initial.cadence); setHrs(initial.min_duration_hours); setB(initial.min_branded_sold); setF(initial.min_freesize_sold); setAmt(initial.bonus_amount) } }, [initial])
  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
      <div className="card bg-white p-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Bonus Configuration</h3>
        <div className="grid gap-3">
          <select className="input" value={cadence} onChange={e=>setCadence(e.target.value)}>
            <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
          <input className="input" type="number" value={min_duration_hours} onChange={e=>setHrs(parseFloat(e.target.value||'0'))} placeholder="Min hours"/>
          <input className="input" type="number" value={min_branded_sold} onChange={e=>setB(parseInt(e.target.value||'0'))} placeholder="Min branded"/>
          <input className="input" type="number" value={min_freesize_sold} onChange={e=>setF(parseInt(e.target.value||'0'))} placeholder="Min free size"/>
          <input className="input" type="number" value={bonus_amount} onChange={e=>setAmt(parseFloat(e.target.value||'0'))} placeholder="Bonus amount"/>
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={()=> onSave({ cadence, min_duration_hours, min_branded_sold, min_freesize_sold, bonus_amount })}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
