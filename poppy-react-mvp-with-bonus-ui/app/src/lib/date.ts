export function startOfWedWeek(d: Date){
  const dow = d.getDay() // 0=Sun..6=Sat
  const offset = ( (dow + 4) % 7 ) // Wed as start
  const start = new Date(d); start.setDate(d.getDate() - offset); start.setHours(0,0,0,0)
  return start
}
export function endOfWedWeek(d: Date){
  const start = startOfWedWeek(d)
  const end = new Date(start); end.setDate(start.getDate()+6); end.setHours(23,59,59,999)
  return end
}
export function thisWeek(){
  const now = new Date()
  return { start: startOfWedWeek(now), end: endOfWedWeek(now) }
}
export function lastWeek(){
  const now = new Date()
  const start = startOfWedWeek(now); start.setDate(start.getDate()-7)
  const end = endOfWedWeek(now); end.setDate(end.getDate()-7)
  return { start, end }
}
export function toISO(dt: Date){ return dt.toISOString() }
