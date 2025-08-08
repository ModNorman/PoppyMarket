import React from 'react'
import DateRangeFilter from '../components/DateRangeFilter'
import StatsStrip from '../components/StatsStrip'
import LogsTable from '../components/LogsTable'
  import BonusRulesModal from '../modals/BonusRulesModal'
import LogEntryModal from '../modals/LogEntryModal'
import { listLogs, createLog, updateLog } from '../api/logs'
import { calculateBonuses, getConfigs } from '../api/bonuses'
import { supabase } from '../lib/supabase'

export default function SellerDashboard(){
  const [range, setRange] = React.useState<{start:string,end:string}|null>(null)
  const [rows, setRows] = React.useState<any[]>([])
  const [stats, setStats] = React.useState<any>()
  const [loading, setLoading] = React.useState(false)
  const [modal, setModal] = React.useState<{open:boolean, initial:any|null}>({ open:false, initial:null })
    const [rulesOpen, setRulesOpen] = React.useState(false)
    const [tips, setTips] = React.useState<Record<string,string>>({})
  const [userId, setUserId] = React.useState<string>('')

  React.useEffect(()=>{ (async()=>{
    const { data: { user } } = await supabase.auth.getUser(); if (user) setUserId(user.id)
  })()},[])

  React.useEffect(()=>{
    (async ()=>{
      if(!range || !userId) return
      setLoading(true)
      const logs = await listLogs({ start: range.start, end: range.end, sellerId: userId })
      setRows(logs)
      const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: userId })
      setStats(s)
      setLoading(false)
    })()
  }, [range, userId])

  async function handleSave(payload:any){
    if(modal.initial){
      await updateLog(modal.initial.id, payload)
    }else{
      await createLog({ ...payload, seller_id: userId, created_by: userId })
    }
    setModal({ open:false, initial:null })
    if(range && userId){
      const logs = await listLogs({ start: range.start, end: range.end, sellerId: userId })
      setRows(logs)
      const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: userId })
      setStats(s)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
        <button className="btn" onClick={()=> setModal({ open:true, initial:null })}>+ Log Entry</button>
      </div>
      <DateRangeFilter onChange={setRange} />
      <div className="my-4"><StatsStrip stats={stats} loading={loading} tooltips={tips} /></div>
      <LogsTable rows={rows} onEdit={(r)=> setModal({ open:true, initial:r })} />
      <LogEntryModal open={modal.open} initial={modal.initial} onClose={()=> setModal({ open:false, initial:null })} onSubmit={handleSave} />
    </div>
  )
}
