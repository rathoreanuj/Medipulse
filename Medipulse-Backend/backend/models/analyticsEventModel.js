import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema({
  category: { type: String, enum: ['auth', 'api'], required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  success: { type: Boolean, required: true },
  statusCode: { type: Number, required: true },
  responseSuccess: { type: Boolean, default: null },
  createdAt: { type: Date, default: Date.now },
})

analyticsEventSchema.index({ createdAt: -1 })
analyticsEventSchema.index({ category: 1, createdAt: -1 })
analyticsEventSchema.index({ endpoint: 1, createdAt: -1 })

const analyticsEventModel = mongoose.models.analyticsEvent || mongoose.model('analyticsEvent', analyticsEventSchema)

export default analyticsEventModel