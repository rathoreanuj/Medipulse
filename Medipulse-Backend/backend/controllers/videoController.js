import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import logger from '../utils/logger.js';

/**
 * Validates that the caller (patient or doctor) is authorized to join
 * the video room for this appointment, then returns the videoRoomId.
 *
 * Headers:
 *   token  → patient JWT
 *   dtoken → doctor JWT
 */
const joinVideoRoom = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const token = req.headers.token;
        const dtoken = req.headers.dtoken;

        if (!appointmentId) return res.json({ success: false, message: 'Appointment ID required' });
        if (!token && !dtoken) return res.json({ success: false, message: 'Authentication required' });

        // Decode caller identity
        let callerId, callerRole;
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                callerId = decoded.id;
                callerRole = 'patient';
            } else {
                const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
                callerId = decoded.id;
                callerRole = 'doctor';
            }
        } catch {
            return res.json({ success: false, message: 'Invalid or expired token' });
        }

        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: 'Appointment not found' });

        if (appointment.consultationType !== 'video') {
            return res.json({ success: false, message: 'This is not a video consultation' });
        }

        if (appointment.cancelled) {
            return res.json({ success: false, message: 'Appointment has been cancelled' });
        }

        // Verify the caller belongs to this appointment
        if (callerRole === 'patient' && appointment.userId !== callerId) {
            return res.json({ success: false, message: 'Not authorized for this appointment' });
        }
        if (callerRole === 'doctor' && appointment.docId !== callerId) {
            return res.json({ success: false, message: 'Not authorized for this appointment' });
        }

        res.json({
            success: true,
            videoRoomId: appointment.videoRoomId,
            callerRole,
            appointment: {
                slotDate: appointment.slotDate,
                slotTime: appointment.slotTime,
                patientName: appointment.userData?.name,
                doctorName: appointment.docData?.name,
                doctorImage: appointment.docData?.image,
                patientImage: appointment.userData?.image,
            }
        });
    } catch (error) {
        logger.error('Video controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

export { joinVideoRoom };
