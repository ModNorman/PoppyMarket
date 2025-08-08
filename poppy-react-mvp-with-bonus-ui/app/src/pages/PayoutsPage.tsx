import React from 'react'
import { listRuns, updateRunStatus } from '../api/payouts'
import { supabase } from '../lib/supabase'
import DateRangeFilter from '../components/DateRangeFilter'

export default function PayoutsPage(){
  const [runs, setRuns] = React.useState<any[]>([])
  const [sellers, setSellers] = React.useState<any[]>([])
  const [seller, setSeller] = React.useState<string>('all')
  const [range, setRange] = React.useState<{start:string,end:string}|null>(null)
  React.useEffect(()=>{ (async()=>{
    const { data } = await supabase.from('profiles').select('id,full_name').order('full_name')
    setSellers(data||[])
  })() }, [])

  React.useEffect(()=>{ (async()=>{
    if(!range) return
    const data = await listRuns({ start: range.start.slice(0,10), end: range.end.slice(0,10), sellerId: seller==='all'? undefined : seller })
    setRuns(data)
  })() }, [range, seller])

  async function setStatus(id: string, status: 'approved'|'paid'){
    await updateRunStatus(id, status)
    if(range){
      const data = await listRuns({ start: range.start.slice(0,10), end: range.end.slice(0,10), sellerId: seller==='all'? undefined : seller })
      setRuns(data)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Payouts</h1>
        <div className="flex gap-2 items-center">
          <span>Seller:</span>
          <select className="input" value={seller} onChange={e=>setSeller(e.target.value)}>
            <option value="all">All</option>
            {sellers.map(s=>(<option key={s.id} value={s.id}>{s.full_name||s.id}</option>))}
          </select>
        </div>
      </div>
      <DateRangeFilter onChange={setRange} />
      <div className="mt-4 overflow-auto">
        <table className="table min-w-[700px]">
          <thead><tr><th className="p-2 text-left">Seller</th><th className="p-2 text-left">Start</th><th className="p-2 text-left">End</th><th className="p-2 text-left">Totals</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Actions</th></tr></thead>
          <tbody>
            {runs.map(r => (
              <tr key={r.id} className="border-b border-stone-200/70">
                <td className="p-2">{sellers.find(s=>s.id===r.seller_id)?.full_name || r.seller_id}</td>
                <td className="p-2">{r.start_date}</td>
                <td className="p-2">{r.end_date}</td>
                <td className="p-2">₱{Number(r.total_payout||0).toFixed(2)}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2 text-right flex justify-end gap-2">
                  <button className="btn" disabled={r.status!=='draft'} onClick={()=>setStatus(r.id, 'approved')}>Approve</button>
                  <button className="btn" disabled={r.status==='paid'} onClick={()=>setStatus(r.id, 'paid')}>Mark Paid</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
