import express from 'express';
import { loginUser, registerUser, verifyOtp, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment } 
     from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import { authLimiter } from '../middleware/rateLimiter.js';
const userRouter = express.Router();

userRouter.post("/register", authLimiter, registerUser)
userRouter.post("/login", authLimiter, loginUser)
userRouter.post("/verify-otp", authLimiter, verifyOtp)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

export default userRouter;