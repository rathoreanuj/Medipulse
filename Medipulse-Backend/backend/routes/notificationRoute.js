import express from 'express'
import authUser from '../middleware/authUser.js'
import authDoctor from '../middleware/authDoctor.js'
import authAdmin from '../middleware/authAdmin.js'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  setUserTarget,
  setDoctorTarget,
  setAdminTarget
} from '../controllers/notificationController.js'

const notificationRouter = express.Router()

notificationRouter.get('/user', authUser, setUserTarget, listNotifications)
notificationRouter.post('/user/mark-read', authUser, setUserTarget, markNotificationRead)
notificationRouter.post('/user/mark-all-read', authUser, setUserTarget, markAllNotificationsRead)

notificationRouter.get('/doctor', authDoctor, setDoctorTarget, listNotifications)
notificationRouter.post('/doctor/mark-read', authDoctor, setDoctorTarget, markNotificationRead)
notificationRouter.post('/doctor/mark-all-read', authDoctor, setDoctorTarget, markAllNotificationsRead)

notificationRouter.get('/admin', authAdmin, setAdminTarget, listNotifications)
notificationRouter.post('/admin/mark-read', authAdmin, setAdminTarget, markNotificationRead)
notificationRouter.post('/admin/mark-all-read', authAdmin, setAdminTarget, markAllNotificationsRead)

export default notificationRouter
