import express from 'express';
import { loginUser, registerUser, verifyOtp, forgotPassword, resetPassword, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, submitReview, getDoctorReviews, getUserReviewedAppointments } 
     from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import { authLimiter } from '../middleware/rateLimiter.js';
const userRouter = express.Router();

userRouter.post("/register", authLimiter, registerUser)
userRouter.post("/login", authLimiter, loginUser)
userRouter.post("/verify-otp", authLimiter, verifyOtp)
userRouter.post("/forgot-password", authLimiter, forgotPassword)
userRouter.post("/reset-password", authLimiter, resetPassword)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)

// Reviews
userRouter.post("/review", authUser, submitReview)
userRouter.get("/reviewed-appointments", authUser, getUserReviewedAppointments)
userRouter.get("/doctor-reviews/:docId", getDoctorReviews)

export default userRouter;