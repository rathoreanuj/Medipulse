import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    paymentMode: { type: String, default: 'cash' }, // 'cash' | 'online'
    isCompleted: { type: Boolean, default: false },
    reminderSentUser: { type: Boolean, default: false },
    reminderSentDoctor: { type: Boolean, default: false },
    reminderSentAdmin: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
    commission: { type: Number, default: 0 },
    consultationType: { type: String, enum: ['in-person', 'video'], default: 'in-person' },
    videoRoomId: { type: String, default: null },
    // reservation/booking status
    status: { type: String, enum: ['reserved', 'booked', 'cancelled'], default: 'booked' },
    reservedAt: { type: Number, default: null },
})

// Index for fetching appointments by user (My Appointments page)
appointmentSchema.index({ userId: 1 })
// Index for fetching appointments by doctor (Doctor dashboard)
appointmentSchema.index({ docId: 1 })
// Index for sorting appointments by date (newest first)
appointmentSchema.index({ date: -1 })
// Prevent double-booking for the same doctor slot when status is 'booked'
appointmentSchema.index({ docId: 1, slotDate: 1, slotTime: 1 }, { unique: true, partialFilterExpression: { status: 'booked' } })

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel