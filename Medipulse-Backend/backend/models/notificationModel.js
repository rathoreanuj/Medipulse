import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ['user', 'doctor', 'admin'], required: true },
    recipientId: { type: String, required: true },
    type: { type: String, default: 'general' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
)

notificationSchema.index({ recipientType: 1, recipientId: 1, isRead: 1, createdAt: -1 })

const notificationModel =
  mongoose.models.notification || mongoose.model('notification', notificationSchema)

export default notificationModel
