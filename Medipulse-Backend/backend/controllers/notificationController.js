import notificationModel from '../models/notificationModel.js'
import logger from '../utils/logger.js'

const listNotifications = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.notificationTarget
    const notifications = await notificationModel
      .find({ recipientType, recipientId })
      .sort({ createdAt: -1 })
      .limit(30)

    const unreadCount = await notificationModel.countDocuments({
      recipientType,
      recipientId,
      isRead: false
    })

    res.json({ success: true, notifications, unreadCount })
  } catch (error) {
    logger.error('Notification controller error', { error: error.message })
    res.json({ success: false, message: error.message })
  }
}

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.body
    const { recipientType, recipientId } = req.notificationTarget

    if (!notificationId) {
      return res.json({ success: false, message: 'notificationId is required' })
    }

    const updated = await notificationModel.findOneAndUpdate(
      { _id: notificationId, recipientType, recipientId },
      { isRead: true },
      { new: true }
    )

    if (!updated) {
      return res.json({ success: false, message: 'Notification not found' })
    }

    const unreadCount = await notificationModel.countDocuments({
      recipientType,
      recipientId,
      isRead: false
    })

    res.json({ success: true, unreadCount })
  } catch (error) {
    logger.error('Notification controller error', { error: error.message })
    res.json({ success: false, message: error.message })
  }
}

const markAllNotificationsRead = async (req, res) => {
  try {
    const { recipientType, recipientId } = req.notificationTarget

    await notificationModel.updateMany(
      { recipientType, recipientId, isRead: false },
      { isRead: true }
    )

    res.json({ success: true, unreadCount: 0 })
  } catch (error) {
    logger.error('Notification controller error', { error: error.message })
    res.json({ success: false, message: error.message })
  }
}

const setUserTarget = (req, _res, next) => {
  req.notificationTarget = { recipientType: 'user', recipientId: req.body.userId }
  next()
}

const setDoctorTarget = (req, _res, next) => {
  req.notificationTarget = { recipientType: 'doctor', recipientId: req.body.docId }
  next()
}

const setAdminTarget = (req, _res, next) => {
  req.notificationTarget = { recipientType: 'admin', recipientId: 'global' }
  next()
}

export {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  setUserTarget,
  setDoctorTarget,
  setAdminTarget
}
