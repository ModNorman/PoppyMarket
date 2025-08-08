import React from 'react'
type Props = { rows: any[], onEdit?: (row:any)=>void }
export default function LogsTable({ rows, onEdit }: Props){
  if (!rows?.length) return <div className="p-4 text-stone-500">No logs yet.</div>
  return (
    <table className="table">
      <thead><tr><th className="text-left p-2">Start</th><th className="text-left p-2">End</th><th className="text-left p-2">Branded</th><th className="text-left p-2">Free Size</th><th></th></tr></thead>
      <tbody>
        {rows.map(r=> (
          <tr key={r.id} className="border-b border-stone-200/70">
            <td className="p-2">{new Date(r.start_time).toLocaleString()}</td>
            <td className="p-2">{new Date(r.end_time).toLocaleString()}</td>
            <td className="p-2">{r.branded_sold}</td>
            <td className="p-2">{r.free_size_sold}</td>
            <td className="p-2 text-right"><button className="btn" onClick={()=>onEdit?.(r)}>Edit</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
