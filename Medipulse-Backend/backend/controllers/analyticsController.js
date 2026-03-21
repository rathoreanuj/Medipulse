import analyticsEventModel from '../models/analyticsEventModel.js'
import appointmentModel from '../models/appointmentModel.js'
import { parseAppointmentDateTime } from '../utils/dateTime.js'
import logger from '../utils/logger.js'

const toPercent = (num) => Math.round(num * 100) / 100

const getRate = (numerator, denominator) => {
  if (!denominator) return null
  return toPercent((numerator / denominator) * 100)
}

const getImpactMetrics = async (req, res) => {
  try {
    const parsedDays = Number(req.query.days)
    const days = Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(Math.floor(parsedDays), 365) : 90
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [reliabilityByCategory, topFailingEndpoints, appointments] = await Promise.all([
      analyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: fromDate } } },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            success: { $sum: { $cond: ['$success', 1, 0] } },
          }
        }
      ]),
      analyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: fromDate }, success: false } },
        {
          $group: {
            _id: { endpoint: '$endpoint', method: '$method' },
            failures: { $sum: 1 }
          }
        },
        { $sort: { failures: -1 } },
        { $limit: 5 }
      ]),
      appointmentModel.find({ status: 'booked' }).select('slotDate slotTime isCompleted cancelled reminderSentUser payment').lean(),
    ])

    const reliability = {
      auth: { total: 0, success: 0, reliabilityPct: null },
      api: { total: 0, success: 0, reliabilityPct: null },
    }

    for (const item of reliabilityByCategory) {
      const category = item._id === 'auth' ? 'auth' : 'api'
      reliability[category] = {
        total: item.total,
        success: item.success,
        reliabilityPct: getRate(item.success, item.total),
      }
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let preReminderTotal = 0
    let preReminderMissed = 0
    let postReminderTotal = 0
    let postReminderMissed = 0
    let completedThisMonth = 0
    let bookedTotal = 0
    let paidTotal = 0

    for (const appt of appointments) {
      if (appt.cancelled) continue

      bookedTotal += 1
      if (appt.payment) paidTotal += 1

      const appointmentAt = parseAppointmentDateTime(appt.slotDate, appt.slotTime)
      if (!appointmentAt) continue

      if (appt.isCompleted && appointmentAt.getMonth() === currentMonth && appointmentAt.getFullYear() === currentYear) {
        completedThisMonth += 1
      }

      if (appointmentAt.getTime() > Date.now()) continue

      const missed = !appt.isCompleted
      if (appt.reminderSentUser) {
        postReminderTotal += 1
        if (missed) postReminderMissed += 1
      } else {
        preReminderTotal += 1
        if (missed) preReminderMissed += 1
      }
    }

    const preNoShowRate = getRate(preReminderMissed, preReminderTotal)
    const postNoShowRate = getRate(postReminderMissed, postReminderTotal)
    const missedAppointmentReductionPct = preNoShowRate && postNoShowRate !== null
      ? toPercent(((preNoShowRate - postNoShowRate) / preNoShowRate) * 100)
      : null

    const paidConversionRatePct = getRate(paidTotal, bookedTotal)

    res.json({
      success: true,
      windowDays: days,
      metrics: {
        authApiReliability: {
          authReliabilityPct: reliability.auth.reliabilityPct,
          apiReliabilityPct: reliability.api.reliabilityPct,
          authTotalRequests: reliability.auth.total,
          apiTotalRequests: reliability.api.total,
          topFailingEndpoints: topFailingEndpoints.map((item) => ({
            endpoint: item._id.endpoint,
            method: item._id.method,
            failures: item.failures,
          })),
        },
        missedAppointmentReduction: {
          preReminderNoShowRatePct: preNoShowRate,
          postReminderNoShowRatePct: postNoShowRate,
          reductionPct: missedAppointmentReductionPct,
          preReminderSampleSize: preReminderTotal,
          postReminderSampleSize: postReminderTotal,
        },
        consultationsPerMonth: {
          currentMonthCompleted: completedThisMonth,
          label: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        },
        paidConversion: {
          bookingToPaidRatePct: paidConversionRatePct,
          paidAppointments: paidTotal,
          totalBookedAppointments: bookedTotal,
        },
      },
      notes: [
        'Auth/API reliability is calculated from tracked API response outcomes.',
        'Missed appointment reduction compares no-show rates between appointments without vs with reminders.',
      ]
    })
  } catch (error) {
    logger.error('Analytics controller error', { error: error.message })
    res.json({ success: false, message: error.message })
  }
}

export { getImpactMetrics }