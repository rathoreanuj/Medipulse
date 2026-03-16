import express from 'express'
import authUser from '../middleware/authUser.js'
import authDoctor from '../middleware/authDoctor.js'
import { getMessages, getDoctorMessages } from '../controllers/chatController.js'

const chatRouter = express.Router()

// Patient fetches message history for their appointment
chatRouter.get('/messages/:appointmentId', authUser, getMessages)

// Doctor fetches message history for their appointment
chatRouter.get('/doctor/messages/:appointmentId', authDoctor, getDoctorMessages)

export default chatRouter
