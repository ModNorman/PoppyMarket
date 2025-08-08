import React from 'react'
type Props = { rows: any[], onEdit?: (row:any)=>void, showSeller?: boolean, sellerLookup?: (id:string)=>string }
export default function LogsTable({ rows, onEdit, showSeller, sellerLookup }: Props){
  if (!rows?.length) return <div className="p-4 text-stone-500">No logs yet.</div>
  return (
    <div className="overflow-x-auto w-full">
    <table className="table min-w-[720px]">
      <thead><tr>
        {showSeller && <th className="text-left p-2">Seller</th>}
        <th className="text-left p-2">Start</th>
        <th className="text-left p-2">End</th>
        <th className="text-left p-2">Duration</th>
        <th className="text-left p-2">Branded</th>
        <th className="text-left p-2">Free Size</th>
        <th></th>
      </tr></thead>
      <tbody>
        {rows.map(r=> {
          const durMin = Math.max(0, Math.round((new Date(r.end_time).getTime() - new Date(r.start_time).getTime())/60000))
          const hh = String(Math.floor(durMin/60)).padStart(2,'0'); const mm = String(durMin%60).padStart(2,'0')
          return (
          <tr key={r.id} className="border-b border-stone-200/70">
            {showSeller && <td className="p-2">{sellerLookup?.(r.seller_id) || r.seller_id}</td>}
            <td className="p-2">{new Date(r.start_time).toLocaleString()}</td>
            <td className="p-2">{new Date(r.end_time).toLocaleString()}</td>
            <td className="p-2">{hh}:{mm}</td>
            <td className="p-2">{r.branded_sold}</td>
            <td className="p-2">{r.free_size_sold}</td>
            <td className="p-2 text-right"><button className="btn" onClick={()=>onEdit?.(r)}>Edit</button></td>
          </tr>
        )})}
      </tbody>
    </table>
    </div>
  )
}
