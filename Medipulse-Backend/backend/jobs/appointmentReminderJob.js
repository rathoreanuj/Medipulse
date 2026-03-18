import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'
import { sendAppointmentReminderEmail } from '../services/emailService.js'
import { createSystemNotification } from '../services/systemNotificationService.js'
import { parseAppointmentDateTime } from '../utils/dateTime.js'

const sendUpcomingAppointmentReminders = async () => {
  const now = Date.now()

  const candidates = await appointmentModel.find({
    cancelled: false,
    isCompleted: false,
    $or: [
      { reminderSentUser: { $ne: true } },
      { reminderSentDoctor: { $ne: true } }
    ]
  }).limit(200)

  for (const appt of candidates) {
    const appointmentAt = parseAppointmentDateTime(appt.slotDate, appt.slotTime)
    if (!appointmentAt) continue

    const appointmentTime = appointmentAt.getTime()
    const isVideo = appt.consultationType === 'video'

    // Video: remind 1 hour before. Clinic: remind 4 hours before.
    const reminderWindow = isVideo ? (60 * 60 * 1000) : (4 * 60 * 60 * 1000)
    const reminderUntil = now + reminderWindow

    // Only send if appointment is within the reminder window (and in the future)
    if (appointmentTime <= now || appointmentTime > reminderUntil) continue

    const doctorName = appt.docData?.name || 'Doctor'
    const patientName = appt.userData?.name || 'Patient'
    const typeLabel = isVideo ? 'Video' : 'Clinic'
    const updateData = {}

    if (!appt.reminderSentUser) {
      await createSystemNotification({
        recipientType: 'user',
        recipientId: appt.userId,
        type: 'reminder',
        title: `${typeLabel} appointment reminder`,
        message: `Your ${typeLabel.toLowerCase()} appointment with ${doctorName} is at ${appt.slotTime} today.`,
        link: '/my-appointments',
        meta: { appointmentId: appt._id }
      })

      const patient = await userModel.findById(appt.userId).select('email name').lean()
      if (patient?.email) {
        try {
          await sendAppointmentReminderEmail(
            patient.email,
            patient.name || patientName,
            doctorName,
            appt.slotDate,
            appt.slotTime,
            appt.consultationType || (isVideo ? 'video' : 'clinic')
          )
        } catch (emailErr) {
          console.log('Reminder email failed:', emailErr.message)
        }
      }

      updateData.reminderSentUser = true
    }

    if (!appt.reminderSentDoctor) {
      await createSystemNotification({
        recipientType: 'doctor',
        recipientId: appt.docId,
        type: 'reminder',
        title: `${typeLabel} appointment reminder`,
        message: `${typeLabel} appointment with ${patientName} at ${appt.slotTime} today.`,
        link: '/doctor-appointments',
        meta: { appointmentId: appt._id }
      })
      updateData.reminderSentDoctor = true
    }

    if (Object.keys(updateData).length > 0) {
      await appointmentModel.findByIdAndUpdate(appt._id, updateData)
    }
  }
}

const startAppointmentReminderJob = () => {
  setInterval(() => {
    sendUpcomingAppointmentReminders().catch((error) => {
      console.log('Reminder job error:', error.message)
    })
  }, 60 * 1000)
}

export { sendUpcomingAppointmentReminders, startAppointmentReminderJob }
