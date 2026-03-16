import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { createServer } from "http"
import { Server } from "socket.io"
import jwt from 'jsonwebtoken'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import contactRouter from "./routes/contactRoute.js"
import chatRouter from "./routes/chatRoute.js"
import { globalLimiter } from "./middleware/rateLimiter.js"
import appointmentModel from "./models/appointmentModel.js"
import chatModel from "./models/chatModel.js"

const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

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

io.on("connection", (socket) => {

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
      const newMsg = await chatModel.create({ appointmentId, senderId, senderType, message })
      io.to(appointmentId).emit("new-message", newMsg)
    } catch (error) {
      socket.emit("error", error.message)
    }
  })
})

httpServer.listen(port, () => console.log(`Server started on http://localhost:${port}`))

// Keep Render free tier alive (ping every 14 min)
setInterval(() => {
  fetch(`https://medipulse-backend.onrender.com/`)
    .catch(() => {}) // ignore errors
}, 14 * 60 * 1000)