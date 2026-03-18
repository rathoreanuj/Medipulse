import notificationModel from '../models/notificationModel.js'
import logger from '../utils/logger.js'

let ioInstance = null

const ALLOWED_NOTIFICATION_TYPES = {
  user: new Set(['chat', 'reminder', 'appointment']),
  doctor: new Set(['chat', 'reminder', 'appointment', 'admin']),
  admin: new Set(['complaint', 'weekly-revenue', 'premium-joined', 'admin'])
}

const isNotificationAllowed = (recipientType, type) => {
  const allowedTypes = ALLOWED_NOTIFICATION_TYPES[recipientType]
  if (!allowedTypes) return false
  return allowedTypes.has(type)
}

const getRoomName = (recipientType, recipientId) => {
  if (recipientType === 'admin') return 'admin-global'
  return `${recipientType}-${recipientId}`
}

const setNotificationSocketServer = (io) => {
  ioInstance = io
}

const createNotification = async ({
  recipientType,
  recipientId,
  type = 'general',
  title,
  message,
  link = '',
  meta = {}
}) => {
  try {
    if (!isNotificationAllowed(recipientType, type)) {
      return null
    }

    const notification = await notificationModel.create({
      recipientType,
      recipientId,
      type,
      title,
      message,
      link,
      meta
    })

    if (ioInstance) {
      ioInstance.to(getRoomName(recipientType, recipientId)).emit('notification-created', notification)
    }

    return notification
  } catch (error) {
    logger.error('Notification service error', { error: error.message })
    return null
  }
}

export { createNotification, getRoomName, setNotificationSocketServer }
