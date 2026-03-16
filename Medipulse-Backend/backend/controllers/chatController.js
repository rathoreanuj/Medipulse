import appointmentModel from "../models/appointmentModel.js"
import chatModel from "../models/chatModel.js"

// Get chat history for a patient (verified by authUser middleware)
const getMessages = async (req, res) => {
    try {
        const { appointmentId } = req.params
        const { userId } = req.body

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) return res.json({ success: false, message: "Appointment not found" })
        if (appointment.userId !== userId) return res.json({ success: false, message: "Not authorized" })

        const messages = await chatModel.find({ appointmentId }).sort({ createdAt: 1 })
        res.json({ success: true, messages })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get chat history for a doctor (verified by authDoctor middleware)
const getDoctorMessages = async (req, res) => {
    try {
        const { appointmentId } = req.params
        const { docId } = req.body

        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) return res.json({ success: false, message: "Appointment not found" })
        if (appointment.docId !== docId) return res.json({ success: false, message: "Not authorized" })

        const messages = await chatModel.find({ appointmentId }).sort({ createdAt: 1 })
        res.json({ success: true, messages })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { getMessages, getDoctorMessages }
