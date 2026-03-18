import nodemailer from 'nodemailer'

const mailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null

const sendChatNotificationEmail = async ({ toEmail, toName, fromName, message, appointmentId }) => {
  if (!mailTransporter || !toEmail) return

  const safeMessage = String(message || '').slice(0, 500)

  await mailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `New chat message from ${fromName} | MediPulse`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e7e7; border-radius: 8px; overflow: hidden;">
        <div style="background: #5f6FFF; color: #fff; padding: 16px 20px;">
          <h2 style="margin: 0; font-size: 20px;">MediPulse Chat Update</h2>
        </div>
        <div style="padding: 20px; color: #333;">
          <p style="margin-top: 0;">Hi ${toName || 'there'},</p>
          <p>You received a new message from <strong>${fromName}</strong>.</p>
          <div style="background: #f6f8ff; border-left: 4px solid #5f6FFF; padding: 12px; border-radius: 4px; margin: 14px 0;">
            ${safeMessage}
          </div>
          <p style="margin-bottom: 0;">Appointment ID: <strong>${appointmentId}</strong></p>
        </div>
      </div>
    `
  })
}

export { sendChatNotificationEmail }
