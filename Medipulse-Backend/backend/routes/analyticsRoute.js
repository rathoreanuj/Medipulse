import express from 'express'
import authAdmin from '../middleware/authAdmin.js'
import { getImpactMetrics } from '../controllers/analyticsController.js'

const analyticsRouter = express.Router()

analyticsRouter.get('/admin/impact-metrics', authAdmin, getImpactMetrics)

export default analyticsRouter