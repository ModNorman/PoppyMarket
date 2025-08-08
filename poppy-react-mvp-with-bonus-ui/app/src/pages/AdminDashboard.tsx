import React from 'react'
import DateRangeFilter from '../components/DateRangeFilter'
import StatsStrip from '../components/StatsStrip'
import LogsTable from '../components/LogsTable'
import LogEntryModal from '../modals/LogEntryModal'
import BonusConfigModal from '../modals/BonusConfigModal'
import { listLogs, updateLog } from '../api/logs'
import { calculateBonuses, aggregateStats, getConfigs, upsertConfig } from '../api/bonuses'
import { supabase } from '../lib/supabase'
import { generateRun } from '../api/payouts'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard(){
  const nav = useNavigate()
  const [range, setRange] = React.useState<{start:string,end:string}|null>(null)
  const [seller, setSeller] = React.useState<string>('all')
  const [sellers, setSellers] = React.useState<any[]>([])
  const [rows, setRows] = React.useState<any[]>([])
  const [stats, setStats] = React.useState<any>()
  const [loading, setLoading] = React.useState(false)
  const [modal, setModal] = React.useState<{open:boolean, initial:any|null}>({ open:false, initial:null })

  // Bonus config modal state
  const [cfgOpen, setCfgOpen] = React.useState(false)
  const [cfgInitial, setCfgInitial] = React.useState<any>({ cadence: 'daily', min_duration_hours: 0, min_branded_sold: 0, min_freesize_sold: 0, bonus_amount: 0 })

  React.useEffect(()=>{ (async()=>{
    const { data } = await supabase.from('profiles').select('id,full_name').order('full_name')
    setSellers(data||[])
  })()},[])

  React.useEffect(()=>{
    (async ()=>{
      if(!range) return
      setLoading(true)
      if(seller==='all'){
        const logs = await listLogs({ start: range.start, end: range.end })
        setRows(logs)
        const s = await aggregateStats({ startDate: range.start, endDate: range.end })
        setStats({ ...s, branded: s?.total_branded_sold, freeSize: s?.total_freesize_sold, basePay: s?.total_base_pay, dailyBonus: s?.total_daily_bonus, weeklyBonus: s?.total_weekly_bonus, monthlyBonus: s?.total_monthly_bonus, totalPayout: s?.final_total_payout })
      } else {
        const logs = await listLogs({ start: range.start, end: range.end, sellerId: seller })
        setRows(logs)
        const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: seller })
        setStats(s)
      }
      setLoading(false)
    })()
  }, [range, seller])

  async function openConfig(){
    const cfgs = await getConfigs()
    const daily = cfgs?.find((c:any)=>c.cadence==='daily')
    setCfgInitial(daily || { cadence: 'daily', min_duration_hours: 0, min_branded_sold: 0, min_freesize_sold: 0, bonus_amount: 0 })
    setCfgOpen(true)
  }

  async function saveConfig(payload:any){
    await upsertConfig(payload)
    setCfgOpen(false)
    // Refresh stats to reflect tooltip changes (if any calculations depend later)
    if(range){
      if(seller==='all'){
        const s = await aggregateStats({ startDate: range.start, endDate: range.end })
        setStats({ ...s, branded: s?.total_branded_sold, freeSize: s?.total_freesize_sold, basePay: s?.total_base_pay, dailyBonus: s?.total_daily_bonus, weeklyBonus: s?.total_weekly_bonus, monthlyBonus: s?.total_monthly_bonus, totalPayout: s?.final_total_payout })
      } else {
        const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: seller })
        setStats(s)
      }
    }
  }

  async function genPayout(){
    if (!range || seller==='all') return
    await generateRun({ sellerId: seller, startDate: range.start.slice(0,10), endDate: range.end.slice(0,10), dryRun: false })
    alert('Payout run generated for selected seller & range.')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2 items-center">
          <button className="btn" onClick={openConfig}>Configure Bonuses</button>
          <button className="btn" onClick={()=> nav('/admin/payouts')}>Payouts</button>
          <span>Seller:</span>
          <select className="input" value={seller} onChange={e=>setSeller(e.target.value)}>
            <option value="all">All</option>
            {sellers.map(s=>(<option key={s.id} value={s.id}>{s.full_name||s.id}</option>))}
          </select>
          <button className="btn" disabled={seller==='all' || !range} onClick={genPayout}>Generate Payout</button>
        </div>
      </div>
      <DateRangeFilter onChange={setRange} />
      <div className="my-4"><StatsStrip stats={stats} loading={loading} /></div>
      <LogsTable rows={rows} onEdit={(r)=> setModal({ open:true, initial:r })} />
      <LogEntryModal open={modal.open} initial={modal.initial} onClose={()=> setModal({ open:false, initial:null })} onSubmit={async (payload)=>{ await updateLog(modal.initial!.id, payload); setModal({ open:false, initial:null }) }} />
      <BonusConfigModal open={cfgOpen} initial={cfgInitial} onClose={()=> setCfgOpen(false)} onSave={saveConfig} />
    </div>
  )
}
