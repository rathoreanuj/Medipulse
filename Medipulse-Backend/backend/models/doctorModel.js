import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    planExpiry: { type: Date, default: null },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },
    averageRating: { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },
}, { minimize: false })

// Index for filtering doctors by speciality (Doctors listing page)
doctorSchema.index({ speciality: 1 })
// Index for filtering available doctors
doctorSchema.index({ available: 1 })

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;