import { createNotification } from './notificationService.js'
import logger from '../utils/logger.js'

const createSystemNotification = async ({ recipientType, recipientId, title, message, type, link, meta }) => {
  try {
    await createNotification({ recipientType, recipientId, title, message, type, link, meta })
  } catch (error) {
    logger.error('Notification create error', { error: error.message })
  }
}

export { createSystemNotification }
