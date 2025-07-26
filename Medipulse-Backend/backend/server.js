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

app.use(express.json())
app.use(cors({
  origin: [
    "https://medipulse-frontend-mps8kyvy0-anuj-rathores-projects-83c4a960.vercel.app",
    "https://medipulse-frontend-eydr-o9eo8q4ba.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true
}))

app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))