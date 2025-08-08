import React from 'react'

type Props = { open: boolean, initial?: any, onClose: ()=>void, onSubmit: (payload:any)=>void }
export default function LogEntryModal({ open, initial, onClose, onSubmit }: Props){
  const [start_time, setStart] = React.useState(initial?.start_time || '')
  const [end_time, setEnd] = React.useState(initial?.end_time || '')
  const [branded_sold, setBranded] = React.useState(initial?.branded_sold || 0)
  const [free_size_sold, setFree] = React.useState(initial?.free_size_sold || 0)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const durationMins = React.useMemo(()=>{
    const s = start_time ? new Date(start_time).getTime() : NaN
    const e = end_time ? new Date(end_time).getTime() : NaN
    if (isNaN(s) || isNaN(e) || e <= s) return 0
    return Math.round((e - s) / 60000)
  }, [start_time, end_time])

  const durationHHMM = React.useMemo(()=>{
    const h = Math.floor(durationMins / 60); const m = durationMins % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }, [durationMins])

  React.useEffect(()=>{
    if (initial){ setStart(initial.start_time?.slice(0,16)); setEnd(initial.end_time?.slice(0,16)); setBranded(initial.branded_sold||0); setFree(initial.free_size_sold||0) }
  }, [initial])

  function validate(){
    if (!start_time || !end_time) return 'Start and End are required.'
    if (new Date(end_time) <= new Date(start_time)) return 'End must be after Start.'
    if (durationMins > 24*60) return 'Duration cannot exceed 24 hours.'
    if (branded_sold < 0 || free_size_sold < 0) return 'Counts cannot be negative.'
    return null
  }

  async function handleSave(){
    const err = validate(); if (err){ setError(err); return }
    setError(null); setSaving(true)
    try {
      await onSubmit({ start_time, end_time, branded_sold, free_size_sold })
    } finally { setSaving(false) }
  }

  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
      <div className="card bg-white p-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{initial? 'Edit Log' : 'New Log'}</h3>
        <div className="grid gap-3">
          <input type="datetime-local" className="input" value={start_time} onChange={e=>setStart(e.target.value)} />
          <input type="datetime-local" className="input" value={end_time} onChange={e=>setEnd(e.target.value)} />
          <div className="text-sm text-stone-600">Duration: <b>{durationHHMM}</b></div>
          <input type="number" className="input" value={branded_sold} onChange={e=>setBranded(parseInt(e.target.value||'0'))} placeholder="Branded sold" />
          <input type="number" className="input" value={free_size_sold} onChange={e=>setFree(parseInt(e.target.value||'0'))} placeholder="Free size sold" />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={!!validate() || saving} onClick={handleSave}>{saving? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
