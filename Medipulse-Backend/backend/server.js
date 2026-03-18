import 'dotenv/config'
import { createServer } from "http"
import { Server } from "socket.io"
import mongoose from 'mongoose'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import createExpressApp from "./app/createExpressApp.js"
import { socketCorsOptions } from "./config/corsConfig.js"
import { setNotificationSocketServer } from "./services/notificationService.js"
import registerSocketHandlers from "./socket/registerSocketHandlers.js"
import { startAppointmentReminderJob } from "./jobs/appointmentReminderJob.js"
import { startWeeklyRevenueNotificationJob } from "./jobs/weeklyRevenueNotificationJob.js"
import logger from './utils/logger.js'

const port = process.env.PORT || 4000

const bootstrap = async () => {
  try {
    await connectDB()
    logger.info('Startup self-check passed: MongoDB connected')

    await connectCloudinary()
    logger.info('Startup self-check passed: Cloudinary configured')

    const app = createExpressApp()
    const httpServer = createServer(app)
    const io = new Server(httpServer, {
      cors: socketCorsOptions
    })

    setNotificationSocketServer(io)
    registerSocketHandlers(io)
    logger.info('Startup self-check passed: Socket.IO initialized')

    const appointmentReminderTimer = startAppointmentReminderJob()
    const weeklyRevenueTimer = startWeeklyRevenueNotificationJob()
    logger.info('Startup self-check passed: background jobs started')

    // Keep Render free tier alive (ping every 14 min)
    const keepAliveTimer = setInterval(() => {
      fetch('https://medipulse-backend.onrender.com/')
        .catch(() => {})
    }, 14 * 60 * 1000)

    httpServer.listen(port, () => {
      logger.info('Server started', { port })
    })

    let isShuttingDown = false

    const shutdown = async (signal) => {
      if (isShuttingDown) return
      isShuttingDown = true

      logger.warn('Shutdown signal received', { signal })

      clearInterval(appointmentReminderTimer)
      clearInterval(weeklyRevenueTimer)
      clearInterval(keepAliveTimer)
      logger.info('Timers cleared')

      await new Promise((resolve) => {
        io.close(() => resolve())
      })
      logger.info('Socket.IO server closed')

      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
      logger.info('HTTP server closed')

      await mongoose.connection.close()
      logger.info('MongoDB connection closed')

      process.exit(0)
    }

    process.on('SIGINT', () => {
      shutdown('SIGINT').catch((error) => {
        logger.error('Graceful shutdown failed', { error: error.message })
        process.exit(1)
      })
    })

    process.on('SIGTERM', () => {
      shutdown('SIGTERM').catch((error) => {
        logger.error('Graceful shutdown failed', { error: error.message })
        process.exit(1)
      })
    })
  } catch (error) {
    logger.error('Server bootstrap failed', { error: error.message })
    process.exit(1)
  }
}

bootstrap()