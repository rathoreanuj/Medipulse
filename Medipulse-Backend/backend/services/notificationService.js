import notificationModel from '../models/notificationModel.js'

let ioInstance = null

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
    console.log('Notification service error:', error.message)
    return null
  }
}

export { createNotification, getRoomName, setNotificationSocketServer }
