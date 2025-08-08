import React from 'react'
import { thisWeek, lastWeek, toISO } from '../lib/date'

type Props = { onChange: (r: { start: string, end: string }) => void }
export default function DateRangeFilter({ onChange }: Props){
  const [preset, setPreset] = React.useState<'this'|'last'|'custom'>('this')
  const [start, setStart] = React.useState<string>('')
  const [end, setEnd] = React.useState<string>('')

  React.useEffect(()=>{
    if (preset === 'this'){ const r = thisWeek(); onChange({ start: toISO(r.start), end: toISO(r.end) }) }
    if (preset === 'last'){ const r = lastWeek(); onChange({ start: toISO(r.start), end: toISO(r.end) }) }
  }, [preset])

  return (
    <div className="flex gap-2 items-center">
      <select className="input" value={preset} onChange={e=>setPreset(e.target.value as any)}>
        <option value="this">This Week (Wed→Tue)</option>
        <option value="last">Last Week</option>
        <option value="custom">Custom</option>
      </select>
      {preset==='custom' && <>
        <input className="input" type="datetime-local" onChange={e=>setStart(e.target.value)} />
        <input className="input" type="datetime-local" onChange={e=>setEnd(e.target.value)} />
        <button className="btn" onClick={()=> onChange({ start, end })}>Apply</button>
      </>}
    </div>
  )
}
