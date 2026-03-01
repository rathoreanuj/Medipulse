import express from 'express';
import { createPaymentIntent, verifyPayment, payForAppointment } from '../controllers/paymentController.js';
import authUser from '../middleware/authUser.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const paymentRouter = express.Router();

// Create payment intent for new appointment
paymentRouter.post('/create-payment-intent', paymentLimiter, authUser, createPaymentIntent);

// Verify payment after successful payment
paymentRouter.post('/verify-payment', paymentLimiter, authUser, verifyPayment);

// Create payment intent for existing unpaid appointment
paymentRouter.post('/pay-appointment', paymentLimiter, authUser, payForAppointment);

export default paymentRouter;
