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

export { sendOtpEmail };
