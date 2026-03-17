import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { createServer } from "http"
import { Server } from "socket.io"
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import contactRouter from "./routes/contactRoute.js"
import chatRouter from "./routes/chatRoute.js"
import notificationRouter from "./routes/notificationRoute.js"
import subscriptionRouter from "./routes/subscriptionRoute.js"
import videoRouter from "./routes/videoRoute.js"
import { globalLimiter } from "./middleware/rateLimiter.js"
import appointmentModel from "./models/appointmentModel.js"
import chatModel from "./models/chatModel.js"
import userModel from "./models/userModel.js"
import doctorModel from "./models/doctorModel.js"
import { createNotification, setNotificationSocketServer } from "./services/notificationService.js"
import { sendAppointmentReminderEmail } from "./services/emailService.js"

const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

const mailTransporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : null

const sendChatNotificationEmail = async ({ toEmail, toName, fromName, message, appointmentId }) => {
  if (!mailTransporter || !toEmail) return

  const safeMessage = String(message || '').slice(0, 500)

  await mailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `New chat message from ${fromName} | MediPulse`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e7e7; border-radius: 8px; overflow: hidden;">
        <div style="background: #5f6FFF; color: #fff; padding: 16px 20px;">
          <h2 style="margin: 0; font-size: 20px;">MediPulse Chat Update</h2>
        </div>
        <div style="padding: 20px; color: #333;">
          <p style="margin-top: 0;">Hi ${toName || 'there'},</p>
          <p>You received a new message from <strong>${fromName}</strong>.</p>
          <div style="background: #f6f8ff; border-left: 4px solid #5f6FFF; padding: 12px; border-radius: 4px; margin: 14px 0;">
            ${safeMessage}
          </div>
          <p style="margin-bottom: 0;">Appointment ID: <strong>${appointmentId}</strong></p>
        </div>
      </div>
    `
  })
}

const parseAppointmentDateTime = (slotDate, slotTime) => {
  if (!slotDate || !slotTime) return null

  const [dayStr, monthStr, yearStr] = String(slotDate).split('_')
  const day = Number(dayStr)
  const month = Number(monthStr)
  const year = Number(yearStr)

  const match = String(slotTime).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!day || !month || !year || !match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()

  if (meridiem === 'PM' && hours < 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

const createSystemNotification = async ({ recipientType, recipientId, title, message, type, link, meta }) => {
  try {
    await createNotification({ recipientType, recipientId, title, message, type, link, meta })
  } catch (error) {
    console.log('Notification create error:', error.message)
  }
}

const allowedOrigins = [
  "https://medipulse-frontend.onrender.com",
  "https://medipulse-admin.onrender.com",
  "https://medipulse-backend.onrender.com/",
  "http://localhost:5175/",
   "http://localhost:5174/",
  "http://localhost:5173/",
   "http://localhost:5176/",
   "http://localhost:4000/",
    "http://localhost:3000/",
]

const isAllowedOrigin = (origin) => {
  // Allow non-browser requests (no Origin header).
  if (!origin) return true

  if (allowedOrigins.includes(origin)) return true

  // Allow any localhost dev origin, e.g. 3000, 5173, 5175, 5176.
  return /^http:\/\/localhost:\d+$/.test(origin)
}

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
      return
    }
    callback(new Error("Not allowed by CORS"))
  },
  credentials: true
}))

app.use(express.json())
app.use(globalLimiter)

app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/contact", contactRouter)
app.use("/api/chat", chatRouter)
app.use("/api/notification", notificationRouter)
app.use("/api/subscription", subscriptionRouter)
app.use("/api/video", videoRouter)

app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "MediPulse API is running successfully."
  });
});

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(new Error("Not allowed by Socket.IO CORS"))
    },
    methods: ["GET", "POST"],
    credentials: true
  }
})

setNotificationSocketServer(io)

io.on("connection", (socket) => {

  // Client joins a personal room to receive message notifications across the portal.
  socket.on("join-notification-room", async ({ token, dtoken, atoken, senderType }) => {
    try {
      if (senderType === "user") {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.join(`user-${decoded.id}`)
        socket.emit("joined-notification-room", { room: `user-${decoded.id}` })
        return
      }

      if (senderType === "doctor") {
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)
        socket.join(`doctor-${decoded.id}`)
        socket.emit("joined-notification-room", { room: `doctor-${decoded.id}` })
        return
      }

      if (senderType === "admin") {
        const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
        if (decoded !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
          socket.emit("error", "Not authorized")
          return
        }
        socket.join('admin-global')
        socket.emit("joined-notification-room", { room: 'admin-global' })
        return
      }

      socket.emit("error", "Invalid sender type")
    } catch (error) {
      socket.emit("error", error.message)
    }
  })

  // Client joins the chat room for a specific appointment
  socket.on("join-room", async ({ appointmentId, token, dtoken, senderType }) => {
    try {
      let senderId
      if (senderType === "user") {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        senderId = decoded.id
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment || appointment.userId !== senderId) {
          socket.emit("error", "Not authorized")
          return
        }
      } else {
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET)
        senderId = decoded.id
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment || appointment.docId !== senderId) {
          socket.emit("error", "Not authorized")
          return
        }
      }
      socket.data.senderId = senderId
      socket.data.senderType = senderType
      socket.data.appointmentId = appointmentId
      socket.join(appointmentId)
      socket.emit("joined", { appointmentId })
    } catch (error) {
      socket.emit("error", error.message)
    }
  })

  // Client sends a new message
  socket.on("send-message", async ({ message }) => {
    try {
      const { senderId, senderType, appointmentId } = socket.data
      if (!senderId || !appointmentId) {
        socket.emit("error", "Not in a room. Join a room first.")
        return
      }
      const appointment = await appointmentModel.findById(appointmentId)
      if (!appointment) {
        socket.emit("error", "Appointment not found")
        return
      }

      const newMsg = await chatModel.create({ appointmentId, senderId, senderType, message })
      io.to(appointmentId).emit("new-message", newMsg)

      const senderName = senderType === 'user'
        ? (appointment.userData?.name || 'Patient')
        : (appointment.docData?.name || 'Doctor')

      const shortMessage = String(message || '').slice(0, 160)

      if (senderType === 'user') {
        io.to(`doctor-${appointment.docId}`).emit("chat-notification", {
          appointmentId,
          senderType,
          senderName,
          message: shortMessage,
          createdAt: newMsg.createdAt
        })

        await createSystemNotification({
          recipientType: 'doctor',
          recipientId: appointment.docId,
          type: 'chat',
          title: `New message from ${senderName}`,
          message: shortMessage,
          link: `/doctor-chat/${appointmentId}`,
          meta: { appointmentId }
        })

        const doctorRecord = appointment.docData?.email ? null : await doctorModel.findById(appointment.docId).select('email')
        const doctorEmail = appointment.docData?.email || doctorRecord?.email
        sendChatNotificationEmail({
          toEmail: doctorEmail,
          toName: appointment.docData?.name || 'Doctor',
          fromName: senderName,
          message: shortMessage,
          appointmentId
        }).catch((error) => console.log('Chat email error:', error.message))
      } else {
        io.to(`user-${appointment.userId}`).emit("chat-notification", {
          appointmentId,
          senderType,
          senderName,
          message: shortMessage,
          createdAt: newMsg.createdAt
        })

        await createSystemNotification({
          recipientType: 'user',
          recipientId: appointment.userId,
          type: 'chat',
          title: `New message from ${senderName}`,
          message: shortMessage,
          link: `/chat/${appointmentId}`,
          meta: { appointmentId }
        })

        const userRecord = appointment.userData?.email ? null : await userModel.findById(appointment.userId).select('email')
        const userEmail = appointment.userData?.email || userRecord?.email
        sendChatNotificationEmail({
          toEmail: userEmail,
          toName: appointment.userData?.name || 'Patient',
          fromName: senderName,
          message: shortMessage,
          appointmentId
        }).catch((error) => console.log('Chat email error:', error.message))
      }
    } catch (error) {
      socket.emit("error", error.message)
    }
  })

  // ─── WebRTC Video Signaling ────────────────────────────────────────────────

  socket.on("join-video-room", async ({ videoRoomId, appointmentId, token, dtoken }) => {
    try {
      let callerId, callerRole;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        callerId = decoded.id;
        callerRole = "patient";
      } else if (dtoken) {
        const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
        callerId = decoded.id;
        callerRole = "doctor";
      } else {
        socket.emit("video-error", "Authentication required");
        return;
      }

      const appointment = await appointmentModel.findById(appointmentId);
      if (!appointment || appointment.consultationType !== 'video' || appointment.videoRoomId !== videoRoomId) {
        socket.emit("video-error", "Invalid video room");
        return;
      }
      if (callerRole === "patient" && appointment.userId !== callerId) {
        socket.emit("video-error", "Not authorized");
        return;
      }
      if (callerRole === "doctor" && appointment.docId !== callerId) {
        socket.emit("video-error", "Not authorized");
        return;
      }

      socket.data.videoRoomId = videoRoomId;
      socket.data.callerRole = callerRole;
      socket.join(videoRoomId);

      const roomSockets = await io.in(videoRoomId).fetchSockets();
      const peersInRoom = roomSockets.length;

      if (peersInRoom === 1) {
        socket.emit("video-joined", { initiator: false, peersInRoom: 1 });
      } else if (peersInRoom === 2) {
        socket.emit("video-joined", { initiator: false, peersInRoom: 2 });
        // Trigger the already-waiting peer to create the WebRTC offer
        socket.to(videoRoomId).emit("video-peer-joined", { initiator: true });
      } else {
        socket.emit("video-error", "Room is full");
        socket.leave(videoRoomId);
      }
    } catch (error) {
      socket.emit("video-error", error.message);
    }
  });

  socket.on("video-offer", ({ videoRoomId, sdp }) => {
    socket.to(videoRoomId).emit("video-offer", { sdp });
  });

  socket.on("video-answer", ({ videoRoomId, sdp }) => {
    socket.to(videoRoomId).emit("video-answer", { sdp });
  });

  socket.on("ice-candidate", ({ videoRoomId, candidate }) => {
    socket.to(videoRoomId).emit("ice-candidate", { candidate });
  });

  socket.on("end-call", ({ videoRoomId }) => {
    io.to(videoRoomId).emit("call-ended");
  });

  socket.on("disconnecting", () => {
    if (socket.data.videoRoomId) {
      socket.to(socket.data.videoRoomId).emit("peer-disconnected");
    }
  });

})

const sendUpcomingAppointmentReminders = async () => {
  const now = Date.now()
  const inFourHours = now + (4 * 60 * 60 * 1000)

  const candidates = await appointmentModel.find({
    cancelled: false,
    isCompleted: false,
    $or: [
      { reminderSentUser: { $ne: true } },
      { reminderSentDoctor: { $ne: true } },
    ]
  }).limit(200)

  for (const appt of candidates) {
    const appointmentAt = parseAppointmentDateTime(appt.slotDate, appt.slotTime)
    if (!appointmentAt) continue

    const appointmentTime = appointmentAt.getTime()
    const isVideo = appt.consultationType === 'video'

    // Video: remind 1 hour before. Clinic: remind 4 hours before.
    const reminderWindow = isVideo ? (60 * 60 * 1000) : (4 * 60 * 60 * 1000)
    const reminderFrom   = now
    const reminderUntil  = now + reminderWindow

    // Only send if appointment is within the reminder window (and in the future)
    if (appointmentTime <= now || appointmentTime > reminderUntil) continue

    const doctorName  = appt.docData?.name  || 'Doctor'
    const patientName = appt.userData?.name || 'Patient'
    const typeLabel   = isVideo ? 'Video' : 'Clinic'
    const updateData  = {}

    if (!appt.reminderSentUser) {
      await createSystemNotification({
        recipientType: 'user',
        recipientId: appt.userId,
        type: 'reminder',
        title: `${typeLabel} appointment reminder`,
        message: `Your ${typeLabel.toLowerCase()} appointment with ${doctorName} is at ${appt.slotTime} today.`,
        link: '/my-appointments',
        meta: { appointmentId: appt._id }
      })

      // Also send email reminder to patient
      const patient = await userModel.findById(appt.userId).select('email name').lean()
      if (patient?.email) {
        try {
          await sendAppointmentReminderEmail(
            patient.email,
            patient.name || patientName,
            doctorName,
            appt.slotDate,
            appt.slotTime,
            appt.consultationType || (isVideo ? 'video' : 'clinic')
          )
        } catch (emailErr) {
          console.log('Reminder email failed:', emailErr.message)
        }
      }

      updateData.reminderSentUser = true
    }

    if (!appt.reminderSentDoctor) {
      await createSystemNotification({
        recipientType: 'doctor',
        recipientId: appt.docId,
        type: 'reminder',
        title: `${typeLabel} appointment reminder`,
        message: `${typeLabel} appointment with ${patientName} at ${appt.slotTime} today.`,
        link: '/doctor-appointments',
        meta: { appointmentId: appt._id }
      })
      updateData.reminderSentDoctor = true
    }

    if (Object.keys(updateData).length > 0) {
      await appointmentModel.findByIdAndUpdate(appt._id, updateData)
    }
  }
}

setInterval(() => {
  sendUpcomingAppointmentReminders().catch((error) => {
    console.log('Reminder job error:', error.message)
  })
}, 60 * 1000)

httpServer.listen(port, () => console.log(`Server started on http://localhost:${port}`))

// Keep Render free tier alive (ping every 14 min)
setInterval(() => {
  fetch(`https://medipulse-backend.onrender.com/`)
    .catch(() => {}) // ignore errors
}, 14 * 60 * 1000)