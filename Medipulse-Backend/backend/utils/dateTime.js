const parseAppointmentDateTime = (slotDate, slotTime) => {
  if (!slotDate || !slotTime) return null

  const [dayStr, monthStr, yearStr] = String(slotDate).split('_')
  const day = Number(dayStr)
  const month = Number(monthStr)
  const year = Number(yearStr)

  const match = String(slotTime).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!day || !month || !year || !match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()

  if (meridiem === 'PM' && hours < 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay() // 0(Sun)-6(Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

export { parseAppointmentDateTime, getWeekStart }
