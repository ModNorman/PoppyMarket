import React from 'react'

type Props = { open: boolean, initial?: any, onClose: ()=>void, onSubmit: (payload:any)=>void }
export default function LogEntryModal({ open, initial, onClose, onSubmit }: Props){
  const [start_time, setStart] = React.useState(initial?.start_time || '')
  const [end_time, setEnd] = React.useState(initial?.end_time || '')
  const [branded_sold, setBranded] = React.useState(initial?.branded_sold || 0)
  const [free_size_sold, setFree] = React.useState(initial?.free_size_sold || 0)

  React.useEffect(()=>{
    if (initial){ setStart(initial.start_time?.slice(0,16)); setEnd(initial.end_time?.slice(0,16)); setBranded(initial.branded_sold||0); setFree(initial.free_size_sold||0) }
  }, [initial])

  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center p-4">
      <div className="card bg-white p-4 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">{initial? 'Edit Log' : 'New Log'}</h3>
        <div className="grid gap-3">
          <input type="datetime-local" className="input" value={start_time} onChange={e=>setStart(e.target.value)} />
          <input type="datetime-local" className="input" value={end_time} onChange={e=>setEnd(e.target.value)} />
          <input type="number" className="input" value={branded_sold} onChange={e=>setBranded(parseInt(e.target.value||'0'))} placeholder="Branded sold" />
          <input type="number" className="input" value={free_size_sold} onChange={e=>setFree(parseInt(e.target.value||'0'))} placeholder="Free size sold" />
          <div className="flex justify-end gap-2">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={()=> onSubmit({ start_time, end_time, branded_sold, free_size_sold })}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
