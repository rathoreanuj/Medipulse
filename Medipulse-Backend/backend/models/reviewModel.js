import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
    userId:        { type: String, required: true },
    docId:         { type: String, required: true },
    appointmentId: { type: String, required: true, unique: true }, // one review per appointment
    rating:        { type: Number, required: true, min: 1, max: 5 },
    comment:       { type: String, default: '', maxlength: 500 },
}, { timestamps: true })

// Fast lookups by doctor (reviews listing) and by user (checking if already reviewed)
reviewSchema.index({ docId: 1, createdAt: -1 })
reviewSchema.index({ userId: 1 })

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema)
export default reviewModel
