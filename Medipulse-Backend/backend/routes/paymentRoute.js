import express from 'express';
import { createPaymentIntent, verifyPayment, payForAppointment } from '../controllers/paymentController.js';
import authUser from '../middleware/authUser.js';

const paymentRouter = express.Router();

// Create payment intent for new appointment
paymentRouter.post('/create-payment-intent', authUser, createPaymentIntent);

// Verify payment after successful payment
paymentRouter.post('/verify-payment', authUser, verifyPayment);

// Create payment intent for existing unpaid appointment
paymentRouter.post('/pay-appointment', authUser, payForAppointment);

export default paymentRouter;
