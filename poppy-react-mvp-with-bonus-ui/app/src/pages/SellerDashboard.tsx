import React from 'react'
import DateRangeFilter from '../components/DateRangeFilter'
import Navbar from '../components/Navbar'
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
  const [error, setError] = React.useState<string | null>(null)
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
      setLoading(true); setError(null)
      try {
        const logs = await listLogs({ start: range.start, end: range.end, sellerId: userId })
        setRows(logs)
        const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: userId })
        setStats(s)
        // Load bonus configs for tooltips
        const cfgs = await getConfigs()
        const map: Record<string,string> = {}
        cfgs?.forEach((c:any)=>{
          const line = `Min ${c.min_duration_hours}h, ${c.min_branded_sold} branded, ${c.min_freesize_sold} free → ₱${Number(c.bonus_amount||0).toFixed(2)}`
          if(c.cadence==='daily') map.dailyBonus = line
          if(c.cadence==='weekly') map.weeklyBonus = line
          if(c.cadence==='monthly') map.monthlyBonus = line
        })
        setTips(map)
      } catch (e:any) {
        console.error('stats fetch error', e)
        setError(e.message || 'Failed to load stats')
        setStats({ branded: 0, freeSize: 0, basePay: 0, dailyBonus: 0, weeklyBonus: 0, monthlyBonus: 0, totalPayout: 0 })
      } finally {
        setLoading(false)
      }
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
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Seller Dashboard</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={()=> setRulesOpen(true)}>Bonus Rules</button>
          <button className="btn" onClick={()=> setModal({ open:true, initial:null })}>+ Log Entry</button>
        </div>
      </div>
      <DateRangeFilter onChange={setRange} />
  {error && <div className="text-red-600 mb-2">{error}</div>}
  <div className="my-4"><StatsStrip stats={stats} loading={loading} tooltips={tips} /></div>
  <LogsTable rows={rows} onEdit={(r)=> setModal({ open:true, initial:r })} />
  <BonusRulesModal open={rulesOpen} onClose={()=> setRulesOpen(false)} />
      <LogEntryModal open={modal.open} initial={modal.initial} onClose={()=> setModal({ open:false, initial:null })} onSubmit={handleSave} />
      </div>
    </div>
  )
}
