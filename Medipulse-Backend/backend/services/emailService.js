import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a 6-digit OTP email for 2FA login verification.
 */
const sendOtpEmail = async (toEmail, otp, userName = 'there') => {
  const mailOptions = {
    from: `"Medipulse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Medipulse Login Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5f6FFF 0%, #3b5bdb 100%); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            🏥 Medipulse
          </h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Healthcare at your fingertips</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 40px;">
          <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px; font-weight: 600;">
            Verify your login
          </h2>
          <p style="color: #64748b; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
            Hi ${userName}, use the verification code below to complete your sign-in. This code expires in <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="background: #f1f5ff; border: 2px dashed #5f6FFF; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
              Your verification code
            </p>
            <p style="margin: 0; font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #3b5bdb;">
              ${otp}
            </p>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            If you didn't request this code, you can safely ignore this email. Someone else may have typed your email address by mistake.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Medipulse. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset link email.
 */
const sendPasswordResetEmail = async (toEmail, resetLink, userName = 'there') => {
  const mailOptions = {
    from: `"Medipulse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your Medipulse Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5f6FFF 0%, #3b5bdb 100%); padding: 32px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            🏥 Medipulse
          </h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Healthcare at your fingertips</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 40px;">
          <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px; font-weight: 600;">
            Reset your password
          </h2>
          <p style="color: #64748b; margin: 0 0 28px; font-size: 15px; line-height: 1.6;">
            Hi ${userName}, we received a request to reset your Medipulse password. Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #5f6FFF 0%, #3b5bdb 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
              Reset Password
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 12px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="background: #f1f5f9; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #5f6FFF; word-break: break-all; margin: 0 0 20px;">
            ${resetLink}
          </p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Medipulse. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


/**
 * Sends a post-consultation AI-generated summary email to the patient.
 */
const sendConsultationSummaryEmail = async (toEmail, patientName, doctorName, summary) => {
  const { chiefComplaint, assessment, recommendations, medications, followUp, disclaimer } = summary;

  const listItems = (arr) =>
    arr && arr.length
      ? arr.map(i => `<li style="margin-bottom:6px;color:#374151;">${i}</li>`).join('')
      : '<li style="color:#9ca3af;">None noted</li>';

  const mailOptions = {
    from: `"Medipulse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your Consultation Summary with Dr. ${doctorName} — Medipulse`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#5f6FFF 0%,#3b5bdb 100%);padding:32px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🏥 Medipulse</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your AI-generated Consultation Summary</p>
        </div>

        <!-- Intro -->
        <div style="background:white;padding:32px 40px 0;">
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 6px;">Hi <strong>${patientName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
            Here is your consultation summary generated after your video appointment with <strong>Dr. ${doctorName}</strong> on <strong>${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</strong>.
          </p>
        </div>

        <!-- Summary Sections -->
        <div style="background:white;padding:0 40px 32px;">

          <!-- Chief Complaint -->
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;font-weight:700;">Chief Complaint</p>
            <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.6;">${chiefComplaint || 'Not specified'}</p>
          </div>

          <!-- Assessment -->
          <div style="background:#fefce8;border-left:4px solid #eab308;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#ca8a04;font-weight:700;">Assessment</p>
            <p style="margin:0;color:#713f12;font-size:14px;line-height:1.6;">${assessment || 'Not specified'}</p>
          </div>

          <!-- Recommendations -->
          <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#16a34a;font-weight:700;">Recommendations</p>
            <ul style="margin:0;padding-left:20px;">${listItems(recommendations)}</ul>
          </div>

          <!-- Medications -->
          <div style="background:#fdf4ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:16px;">
            <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9333ea;font-weight:700;">Medications / Advice</p>
            <ul style="margin:0;padding-left:20px;">${listItems(medications)}</ul>
          </div>

          <!-- Follow-up -->
          <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#ea580c;font-weight:700;">Follow-up</p>
            <p style="margin:0;color:#9a3412;font-size:14px;line-height:1.6;">${followUp || 'As advised by your doctor'}</p>
          </div>

          <!-- Disclaimer -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              ⚠️ <strong>Disclaimer:</strong> ${disclaimer || 'This summary is AI-generated based on doctor notes and is for informational purposes only. It does not replace professional medical advice. Always follow your doctor\'s instructions.'}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Medipulse. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends an appointment reminder email to the patient.
 * @param {string} toEmail
 * @param {string} patientName
 * @param {string} doctorName
 * @param {string} slotDate
 * @param {string} slotTime
 * @param {'video'|'clinic'} consultationType
 */
const sendAppointmentReminderEmail = async (toEmail, patientName, doctorName, slotDate, slotTime, consultationType) => {
  const isVideo = consultationType === 'video'
  const typeLabel  = isVideo ? 'Video Consultation' : 'Clinic Appointment'
  const timeNote   = isVideo ? 'in about 1 hour' : 'in about 4 hours'
  const actionText = isVideo
    ? 'Please ensure you have a stable internet connection and are in a quiet place.'
    : 'Please arrive 10 minutes early at the clinic.'
  const iconEmoji  = isVideo ? '💻' : '🏥'

  const mailOptions = {
    from: `"Medipulse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `⏰ Reminder: Your ${typeLabel} with Dr. ${doctorName} — ${slotDate} at ${slotTime}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#5f6FFF 0%,#3b5bdb 100%);padding:32px 40px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🏥 Medipulse</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Healthcare at your fingertips</p>
        </div>

        <!-- Body -->
        <div style="background:white;padding:36px 40px;">
          <h2 style="color:#1e293b;margin:0 0 6px;font-size:20px;font-weight:600;">
            ${iconEmoji} Appointment Reminder
          </h2>
          <p style="color:#64748b;margin:0 0 24px;font-size:15px;line-height:1.6;">
            Hi <strong>${patientName}</strong>, this is a friendly reminder that your upcoming appointment is <strong>${timeNote}</strong>.
          </p>

          <!-- Appointment Card -->
          <div style="background:#f1f5ff;border-left:4px solid #5f6FFF;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;font-size:13px;padding:5px 0;width:110px;">Type</td>
                <td style="color:#1e293b;font-size:14px;font-weight:600;padding:5px 0;">${typeLabel}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:5px 0;">Doctor</td>
                <td style="color:#1e293b;font-size:14px;font-weight:600;padding:5px 0;">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:5px 0;">Date</td>
                <td style="color:#1e293b;font-size:14px;font-weight:600;padding:5px 0;">${slotDate}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:5px 0;">Time</td>
                <td style="color:#1e293b;font-size:14px;font-weight:600;padding:5px 0;">${slotTime}</td>
              </tr>
            </table>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
            ${actionText}
          </p>

          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-appointments"
             style="display:inline-block;background:#5f6FFF;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">
            View Appointment
          </a>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Medipulse. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export { sendOtpEmail, sendPasswordResetEmail, sendConsultationSummaryEmail, sendAppointmentReminderEmail };
