import mongoose from "mongoose"

const chatSchema = new mongoose.Schema({
    appointmentId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderType: { type: String, enum: ['user', 'doctor'], required: true },
    message: { type: String, required: true },
}, { timestamps: true })

const chatModel = mongoose.models.chat || mongoose.model("chat", chatSchema)
export default chatModel
