import React from 'react'
import DateRangeFilter from '../components/DateRangeFilter'
import Navbar from '../components/Navbar'
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
  const [error, setError] = React.useState<string | null>(null)
  const [modal, setModal] = React.useState<{open:boolean, initial:any|null}>({ open:false, initial:null })
  const [debugOpen, setDebugOpen] = React.useState(false)
  const [debugData, setDebugData] = React.useState<any>(null)

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
      setLoading(true); setError(null)
      try {
        if(seller==='all'){
          const logs = await listLogs({ start: range.start, end: range.end })
          setRows(logs)
          const s = await aggregateStats({ startDate: range.start, endDate: range.end })
          let stats = {
            branded: Number(s?.total_branded_sold || 0),
            freeSize: Number(s?.total_freesize_sold || 0),
            basePay: Number(s?.total_base_pay || 0),
            dailyBonus: Number(s?.total_daily_bonus || 0),
            weeklyBonus: Number(s?.total_weekly_bonus || 0),
            monthlyBonus: Number(s?.total_monthly_bonus || 0),
            totalPayout: Number(s?.final_total_payout || 0)
          }
          // Fallback: if aggregate bonuses are zero but we have sellers, sum per-seller projections
          const hasAny = sellers.length > 0
          const bonusesZero = (stats.dailyBonus + stats.weeklyBonus + stats.monthlyBonus) === 0
          if (hasAny && bonusesZero){
            const perSeller = await Promise.all(
              sellers.map(async (sel)=>{
                try { return await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: sel.id }) }
                catch { return null }
              })
            )
            const sum = perSeller.filter(Boolean).reduce((acc:any, s:any)=>({
              branded: acc.branded + (s.branded||0),
              freeSize: acc.freeSize + (s.freeSize||0),
              basePay: acc.basePay + (s.basePay||0),
              dailyBonus: acc.dailyBonus + (s.dailyBonus||0),
              weeklyBonus: acc.weeklyBonus + (s.weeklyBonus||0),
              monthlyBonus: acc.monthlyBonus + (s.monthlyBonus||0),
              totalPayout: acc.totalPayout + (s.totalPayout||0),
            }), { branded:0, freeSize:0, basePay:0, dailyBonus:0, weeklyBonus:0, monthlyBonus:0, totalPayout:0 })
            stats = sum
          }
          setStats(stats)
        } else {
          const logs = await listLogs({ start: range.start, end: range.end, sellerId: seller })
          setRows(logs)
          const s = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: seller })
          setStats(s)
        }
      } catch (e:any) {
        console.error('admin stats error', e)
        setError(e.message || 'Failed to load stats')
        setStats({ branded: 0, freeSize: 0, basePay: 0, dailyBonus: 0, weeklyBonus: 0, monthlyBonus: 0, totalPayout: 0 })
      } finally {
        setLoading(false)
      }
    })()
  }, [range, seller])

  async function runDebug(){
    if(!range) return
    const out: any = {}
    // Live configs
    const { data: settings } = await supabase.from('app_settings').select('*').eq('key','base_pay').maybeSingle()
    const { data: cfgs } = await supabase.from('bonus_configs').select('*')
    out.base_pay = settings
    out.bonus_configs = cfgs
    try {
      out.aggregateStats = await aggregateStats({ startDate: range.start, endDate: range.end })
    } catch (e:any) { out.aggregateStats = { error: e.message } }
    try {
      const sid = seller==='all' ? sellers[0]?.id : seller
      if (sid) out.calculateBonuses = await calculateBonuses({ startDate: range.start, endDate: range.end, sellerId: sid })
    } catch (e:any) { out.calculateBonuses = { error: e.message } }
    setDebugData(out)
  }

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
        setStats({
          branded: Number(s?.total_branded_sold || 0),
          freeSize: Number(s?.total_freesize_sold || 0),
          basePay: Number(s?.total_base_pay || 0),
          dailyBonus: Number(s?.total_daily_bonus || 0),
          weeklyBonus: Number(s?.total_weekly_bonus || 0),
          monthlyBonus: Number(s?.total_monthly_bonus || 0),
          totalPayout: Number(s?.final_total_payout || 0)
        })
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
    <div>
      <Navbar />
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
          {import.meta.env.DEV && (
            <button className="btn" onClick={()=>{ setDebugOpen(v=>!v); if(!debugOpen) runDebug() }}>{debugOpen? 'Hide Debug' : 'Show Debug'}</button>
          )}
        </div>
      </div>
      <DateRangeFilter onChange={setRange} />
      <div className="my-4"><StatsStrip stats={stats} loading={loading} /></div>
      <LogsTable
        rows={rows}
        onEdit={(r)=> setModal({ open:true, initial:r })}
        showSeller={seller==='all'}
        sellerLookup={(id:string)=> sellers.find(s=>s.id===id)?.full_name || id}
      />
      <LogEntryModal open={modal.open} initial={modal.initial} onClose={()=> setModal({ open:false, initial:null })} onSubmit={async (payload)=>{ await updateLog(modal.initial!.id, payload); setModal({ open:false, initial:null }) }} />
      <BonusConfigModal open={cfgOpen} initial={cfgInitial} onClose={()=> setCfgOpen(false)} onSave={saveConfig} />
      {debugOpen && (
        <div className="mt-6 p-4 rounded border bg-white text-sm overflow-auto">
          <div className="font-semibold mb-2">Debug (live data)</div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
        </div>
      )}
      </div>
    </div>
  )
}
