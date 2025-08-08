import React from 'react'
type Props = { stats?: any, loading?: boolean, tooltips?: Record<string,string> }
export default function StatsStrip({ stats, loading }: Props){
  const cells = [
    { label: 'Branded', key: 'branded' },
    { label: 'Free Size', key: 'freeSize' },
    { label: 'Base Pay', key: 'basePay' },
    { label: 'Daily Bonus', key: 'dailyBonus' },
    { label: 'Weekly Bonus', key: 'weeklyBonus' },
    { label: 'Monthly Bonus', key: 'monthlyBonus' },
    { label: 'Total Payout', key: 'totalPayout' },
  ]
  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
      {cells.map(c=> (
        <div key={c.key} className="stat bg-gradient-to-br from-rose-50 via-white to-stone-50">
          <div className="text-stone-500 text-sm mb-1">{c.label}</div>
          {loading ? <div className="h-6 w-24 animate-pulse rounded bg-stone-200"/> : <div className="font-semibold">{stats?.[c.key] ?? '—'}</div>}
        </div>
      ))}
    </div>
  )
}
