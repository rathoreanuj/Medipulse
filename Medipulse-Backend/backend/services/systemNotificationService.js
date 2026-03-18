import { createNotification } from './notificationService.js'

const createSystemNotification = async ({ recipientType, recipientId, title, message, type, link, meta }) => {
  try {
    await createNotification({ recipientType, recipientId, title, message, type, link, meta })
  } catch (error) {
    console.log('Notification create error:', error.message)
  }
}

export { createSystemNotification }
