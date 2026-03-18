import appointmentModel from '../models/appointmentModel.js'
import notificationModel from '../models/notificationModel.js'
import { createSystemNotification } from '../services/systemNotificationService.js'
import { getWeekStart } from '../utils/dateTime.js'
import logger from '../utils/logger.js'

const sendWeeklyRevenueSummaryNotification = async () => {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`

  const alreadySent = await notificationModel.findOne({
    recipientType: 'admin',
    recipientId: 'global',
    type: 'weekly-revenue',
    'meta.weekKey': weekKey
  }).lean()

  if (alreadySent) return

  const weeklyAppointments = await appointmentModel.find({
    payment: true,
    cancelled: false,
    date: { $gte: weekStart.getTime(), $lte: now.getTime() }
  }).select('amount commission')

  const weeklyRevenue = weeklyAppointments.reduce((sum, item) => sum + (item.amount || 0), 0)
  const weeklyCommission = weeklyAppointments.reduce((sum, item) => sum + (item.commission || 0), 0)

  await createSystemNotification({
    recipientType: 'admin',
    recipientId: 'global',
    type: 'weekly-revenue',
    title: 'Weekly revenue snapshot',
    message: `This week: ${weeklyAppointments.length} paid appointments, ₹${Math.round(weeklyRevenue)} gross revenue, ₹${Math.round(weeklyCommission)} commission.`,
    link: '/revenue-dashboard',
    meta: { weekKey, weeklyAppointments: weeklyAppointments.length, weeklyRevenue, weeklyCommission }
  })
}

const startWeeklyRevenueNotificationJob = () => {
  const timer = setInterval(() => {
    sendWeeklyRevenueSummaryNotification().catch((error) => {
      logger.error('Weekly revenue notification error', { error: error.message })
    })
  }, 60 * 60 * 1000)

  logger.info('Weekly revenue notification job started', { intervalMs: 60 * 60 * 1000 })
  return timer
}

export { sendWeeklyRevenueSummaryNotification, startWeeklyRevenueNotificationJob }
