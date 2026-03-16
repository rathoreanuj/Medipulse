import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary';
import { createNotification } from "../services/notificationService.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../services/emailService.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = { name, email, password: hashedPassword };
        const newUser = new userModel(userData);
        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to user record
        await userModel.findByIdAndUpdate(user._id, { otp, otpExpiry });

        // Send OTP via email
        await sendOtpEmail(user.email, otp, user.name);

        // Return a short-lived temp token (used to identify the user when verifying OTP)
        const tempToken = jwt.sign(
            { id: user._id, purpose: 'otp-verification' },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        res.json({ success: true, requiresOtp: true, tempToken });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp, tempToken } = req.body;
        if (!otp || !tempToken) {
            return res.json({ success: false, message: 'OTP and token are required' });
        }

        // Verify temp token
        let decoded;
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        } catch {
            return res.json({ success: false, message: 'Session expired. Please login again.' });
        }

        if (decoded.purpose !== 'otp-verification') {
            return res.json({ success: false, message: 'Invalid token' });
        }

        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Check OTP expiry
        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            return res.json({ success: false, message: 'OTP has expired. Please login again.' });
        }

        // Check OTP match
        if (user.otp !== otp.trim()) {
            return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // Clear OTP fields
        await userModel.findByIdAndUpdate(user._id, { otp: null, otpExpiry: null });

        // Issue full JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: 'Email is required' });

        const user = await userModel.findOne({ email });
        // Always respond success to prevent email enumeration
        if (!user) return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await userModel.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail(user.email, resetLink, user.name);

        res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.json({ success: false, message: 'Token and password are required' });

        if (password.length < 8) return res.json({ success: false, message: 'Password must be at least 8 characters' });

        const user = await userModel.findOne({ resetToken: token });
        if (!user) return res.json({ success: false, message: 'Invalid or expired reset link' });

        if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
            return res.json({ success: false, message: 'Reset link has expired. Please request a new one.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userModel.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        });

        res.json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file;
        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }
        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            const imageURL = imageUpload.secure_url;
            await userModel.findByIdAndUpdate(userId, { image: imageURL });
        }
        res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime, paymentMode, consultationType } = req.body;
        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }
        let slots_booked = docData.slots_booked;
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' });
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }
        const userData = await userModel.findById(userId).select("-password");
        delete docData.slots_booked;
        const isVideo = consultationType === 'video';
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            paymentMode: paymentMode || 'cash',
            payment: false,
            consultationType: isVideo ? 'video' : 'in-person',
            videoRoomId: isVideo ? `video-${crypto.randomUUID()}` : null,
        };
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        await createNotification({
            recipientType: 'user',
            recipientId: userId,
            type: 'appointment',
            title: 'Appointment booked',
            message: `Your appointment with ${docData.name} is confirmed for ${slotDate} at ${slotTime}.`,
            link: '/my-appointments',
            meta: { appointmentId: newAppointment._id }
        });

        await createNotification({
            recipientType: 'doctor',
            recipientId: docId,
            type: 'appointment',
            title: 'New appointment booked',
            message: `${userData.name} booked ${slotDate} at ${slotTime}.`,
            link: '/doctor-appointments',
            meta: { appointmentId: newAppointment._id }
        });

        await createNotification({
            recipientType: 'admin',
            recipientId: 'global',
            type: 'appointment',
            title: 'New appointment created',
            message: `${userData.name} booked with ${docData.name}.`,
            link: '/all-appointments',
            meta: { appointmentId: newAppointment._id }
        });

        res.json({ success: true, message: 'Appointment Booked', appointmentId: newAppointment._id });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        await createNotification({
            recipientType: 'user',
            recipientId: userId,
            type: 'appointment',
            title: 'Appointment cancelled',
            message: `You cancelled your appointment on ${slotDate} at ${slotTime}.`,
            link: '/my-appointments',
            meta: { appointmentId }
        });

        await createNotification({
            recipientType: 'doctor',
            recipientId: docId,
            type: 'appointment',
            title: 'Appointment cancelled by patient',
            message: `${appointmentData.userData?.name || 'A patient'} cancelled ${slotDate} at ${slotTime}.`,
            link: '/doctor-appointments',
            meta: { appointmentId }
        });

        await createNotification({
            recipientType: 'admin',
            recipientId: 'global',
            type: 'appointment',
            title: 'Appointment cancelled',
            message: `${appointmentData.userData?.name || 'Patient'} cancelled with ${appointmentData.docData?.name || 'doctor'}.`,
            link: '/all-appointments',
            meta: { appointmentId }
        });

        res.json({ success: true, message: 'Appointment Cancelled' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    verifyOtp,
    forgotPassword,
    resetPassword,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment
};
