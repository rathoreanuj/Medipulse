import nodemailer from 'nodemailer'
import { createNotification } from '../services/notificationService.js'

const sendContactEmail = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body

        if (!name || !email || !phone || !message) {
            return res.json({ success: false, message: 'All fields are required' })
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS  // Gmail App Password
            }
        })

        // Email to admin (you receive this)
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission - MediPulse | ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: #5f6FFF; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">MediPulse</h1>
                        <p style="color: #d0d5ff; margin: 5px 0 0;">New Contact Form Submission</p>
                    </div>
                    <div style="padding: 24px; background: #f9f9f9;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; font-weight: bold; color: #555; width: 120px;">Name:</td>
                                <td style="padding: 10px 0; color: #222;">${name}</td>
                            </tr>
                            <tr style="background: #fff;">
                                <td style="padding: 10px; font-weight: bold; color: #555;">Email:</td>
                                <td style="padding: 10px; color: #222;"><a href="mailto:${email}" style="color: #5f6FFF;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; font-weight: bold; color: #555;">Phone:</td>
                                <td style="padding: 10px 0; color: #222;">${phone}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 16px; padding: 16px; background: #fff; border-left: 4px solid #5f6FFF; border-radius: 4px;">
                            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Message:</p>
                            <p style="color: #333; margin: 0; line-height: 1.6;">${message}</p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 12px; color: #999; font-size: 12px;">
                        Sent via MediPulse Contact Form
                    </div>
                </div>
            `
        }

        // Auto-reply to the user
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'We received your message - MediPulse',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <div style="background: #5f6FFF; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">MediPulse</h1>
                    </div>
                    <div style="padding: 24px;">
                        <h2 style="color: #333;">Hi ${name},</h2>
                        <p style="color: #555; line-height: 1.6;">Thank you for reaching out to us! We have received your message and our team will get back to you within 24 hours.</p>
                        <div style="margin: 20px 0; padding: 16px; background: #f9f9f9; border-radius: 6px; border-left: 4px solid #5f6FFF;">
                            <p style="font-weight: bold; color: #555; margin: 0 0 8px;">Your message:</p>
                            <p style="color: #333; margin: 0; line-height: 1.6;">${message}</p>
                        </div>
                        <p style="color: #555;">If you have any urgent needs, feel free to call us directly.</p>
                        <p style="color: #555; margin-top: 24px;">Best regards,<br/><strong>MediPulse Team</strong></p>
                    </div>
                    <div style="text-align: center; padding: 12px; color: #999; font-size: 12px;">
                        © 2026 MediPulse. All rights reserved.
                    </div>
                </div>
            `
        }

        await transporter.sendMail(adminMailOptions)
        await transporter.sendMail(userMailOptions)

        await createNotification({
            recipientType: 'admin',
            recipientId: 'global',
            type: 'complaint',
            title: 'New contact complaint received',
            message: `${name} submitted a contact request: ${String(message).slice(0, 120)}`,
            link: '/contact-messages',
            meta: { name, email, phone }
        })

        res.json({ success: true, message: 'Message sent successfully!' })

    } catch (error) {
        console.log('Contact email error:', error)
        res.json({ success: false, message: 'Failed to send message. Please try again.' })
    }
}

export { sendContactEmail }
