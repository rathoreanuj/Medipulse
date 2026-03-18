import 'dotenv/config'
import { createServer } from "http"
import { Server } from "socket.io"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import createExpressApp from "./app/createExpressApp.js"
import { socketCorsOptions } from "./config/corsConfig.js"
import { setNotificationSocketServer } from "./services/notificationService.js"
import registerSocketHandlers from "./socket/registerSocketHandlers.js"
import { startAppointmentReminderJob } from "./jobs/appointmentReminderJob.js"
import { startWeeklyRevenueNotificationJob } from "./jobs/weeklyRevenueNotificationJob.js"

const port = process.env.PORT || 4000

connectDB()
connectCloudinary()

const app = createExpressApp()

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: socketCorsOptions
})

setNotificationSocketServer(io)
registerSocketHandlers(io)

startAppointmentReminderJob()
startWeeklyRevenueNotificationJob()

httpServer.listen(port, () => console.log(`Server started on http://localhost:${port}`))

// Keep Render free tier alive (ping every 14 min)
setInterval(() => {
  fetch(`https://medipulse-backend.onrender.com/`)
    .catch(() => {}) // ignore errors
}, 14 * 60 * 1000)