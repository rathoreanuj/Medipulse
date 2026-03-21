import express from 'express'
import userRouter from '../routes/userRoute.js'
import doctorRouter from '../routes/doctorRoute.js'
import adminRouter from '../routes/adminRoute.js'
import paymentRouter from '../routes/paymentRoute.js'
import contactRouter from '../routes/contactRoute.js'
import chatRouter from '../routes/chatRoute.js'
import notificationRouter from '../routes/notificationRoute.js'
import subscriptionRouter from '../routes/subscriptionRoute.js'
import videoRouter from '../routes/videoRoute.js'
import analyticsRouter from '../routes/analyticsRoute.js'
import apiMetricsTracker from '../middleware/apiMetricsTracker.js'
import { globalLimiter } from '../middleware/rateLimiter.js'
import { corsMiddleware } from '../config/corsConfig.js'

const createExpressApp = () => {
  const app = express()

  app.use(corsMiddleware)
  app.use(express.json())
  app.use(globalLimiter)
  app.use(apiMetricsTracker)

  app.use('/api/user', userRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/doctor', doctorRouter)
  app.use('/api/payment', paymentRouter)
  app.use('/api/contact', contactRouter)
  app.use('/api/chat', chatRouter)
  app.use('/api/notification', notificationRouter)
  app.use('/api/subscription', subscriptionRouter)
  app.use('/api/video', videoRouter)
  app.use('/api/analytics', analyticsRouter)

  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'MediPulse API is running successfully.'
    })
  })

  return app
}

export default createExpressApp
