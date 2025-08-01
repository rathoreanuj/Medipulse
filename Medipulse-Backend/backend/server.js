import express from "express"
import cors from 'cors'
import 'dotenv/config'
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"

const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

app.use(cors({
  origin: [
    "https://medipulse-frontend.onrender.com",
    "https://medipulse-admin.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true
}))

app.use(express.json())

app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)

app.get("/", (req, res) => {
  res.status(200).json({ message: "MediPulse API is running successfully." });
});

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))
