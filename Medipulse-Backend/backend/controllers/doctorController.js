import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { createNotification } from "../services/notificationService.js";
import logger from "../utils/logger.js";

const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

            // Notify the patient that the doctor cancelled
            await createNotification({
                recipientType: 'user',
                recipientId: appointmentData.userId,
                type: 'appointment',
                title: 'Appointment cancelled by doctor',
                message: `${appointmentData.docData?.name || 'Doctor'} cancelled your appointment on ${appointmentData.slotDate} at ${appointmentData.slotTime}.`,
                link: '/my-appointments',
                meta: { appointmentId }
            })

            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }

}

const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        // Debug logging
        logger.debug('Appointment complete debug start')
        logger.debug('Appointment identifiers', { appointmentId, docId })
        logger.debug('Appointment data snapshot', {
            id: appointmentData?._id,
            docId: appointmentData?.docId,
            isCompleted: appointmentData?.isCompleted,
            payment: appointmentData?.payment
        });
        
        if (appointmentData && appointmentData.docId === docId) {
            // When appointment is completed, mark as completed
            // If payment is not already done (offline/cash payment), mark it as paid
            const updateData = { isCompleted: true }
            
            // If payment was offline (not paid online), automatically mark as paid when completed
            if (!appointmentData.payment) {
                updateData.payment = true
                logger.debug('Setting payment to true (offline payment)')
            } else {
                logger.debug('Payment already true (online payment)')
            }
            
            logger.debug('Appointment update payload', updateData)
            
            const result = await appointmentModel.findByIdAndUpdate(appointmentId, updateData, { new: true })
            
            logger.debug('Updated appointment', {
                isCompleted: result.isCompleted,
                payment: result.payment
            });
            logger.debug('Appointment complete debug end')

            return res.json({ success: true, message: 'Appointment Completed' })
        }

        logger.warn('Doctor ID mismatch or appointment not found', { appointmentId, docId })
        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        logger.error('Doctor appointmentComplete error', { error: error.message, appointmentId: req.body?.appointmentId })
        res.json({ success: false, message: error.message })
    }

}

const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }

}

const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        logger.error('Doctor controller error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}