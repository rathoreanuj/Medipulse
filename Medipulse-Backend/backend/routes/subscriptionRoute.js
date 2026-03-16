import express from 'express';
import {
    getDoctorPlanStatus,
    getPatientPlanStatus,
    createSubscriptionPayment,
    verifySubscriptionPayment,
    getAdminRevenueStats,
} from '../controllers/subscriptionController.js';
import authUser from '../middleware/authUser.js';
import authDoctor from '../middleware/authDoctor.js';
import authAdmin from '../middleware/authAdmin.js';

const subscriptionRouter = express.Router();

// Doctor plan routes
subscriptionRouter.post('/doctor/plan-status', authDoctor, getDoctorPlanStatus);
subscriptionRouter.post('/doctor/create-payment', authDoctor, createSubscriptionPayment);

// Patient plan routes
subscriptionRouter.post('/patient/plan-status', authUser, getPatientPlanStatus);
subscriptionRouter.post('/patient/create-payment', authUser, createSubscriptionPayment);

// Shared verify (accessible by authenticated user or doctor)
subscriptionRouter.post('/verify-payment', verifySubscriptionPayment);

// Admin revenue stats
subscriptionRouter.get('/admin/revenue-stats', authAdmin, getAdminRevenueStats);

export default subscriptionRouter;
