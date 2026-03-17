import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe payment intent for appointment
const createPaymentIntent = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) return res.json({ success: false, message: 'appointmentId is required. Reserve slot first via /api/user/book-appointment' });

        // Load reservation
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) return res.json({ success: false, message: 'Reservation not found' });
        if (appointment.status === 'booked') return res.json({ success: false, message: 'Appointment already booked' });
        if (appointment.status === 'cancelled') return res.json({ success: false, message: 'Appointment cancelled' });

        const docData = appointment.docData;
        const userData = appointment.userData;

        // Ensure doctor is still available
        const doctor = await doctorModel.findById(appointment.docId).select('-password');
        if (!doctor || !doctor.available) return res.json({ success: false, message: 'Doctor Not Available' });

        const finalAmount = Math.round((appointment.amount || 0) * 100) / 100;

        // Create Stripe payment intent (INR, minimum ₹50 per Stripe rules)
        const chargeAmount = Math.max(Math.round(finalAmount), 50);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: chargeAmount * 100, // Stripe INR uses paise
            currency: 'inr',
            metadata: {
                appointmentId: appointment._id.toString(),
                userId: appointment.userId,
                docId: appointment.docId,
                doctorName: docData.name,
                patientName: userData.name,
            },
            description: `Payment for appointment with Dr. ${docData.name} on ${appointment.slotDate} at ${appointment.slotTime}`,
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            appointmentId: appointment._id,
            originalFee: docData.fees,
            finalAmount: chargeAmount,
            message: 'Payment intent created successfully'
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Verify payment and update appointment status
const verifyPayment = async (req, res) => {
    try {
        const { paymentIntentId, appointmentId } = req.body;

        // Retrieve the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update appointment payment status and mark booked
            const appointment = await appointmentModel.findById(appointmentId);
            const commissionRate = appointment?.commissionRate ?? 10;
            const commission = Math.round(((appointment?.amount || 0) * commissionRate / 100) * 100) / 100;

            // Mark appointment as paid and booked
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true, commission, status: 'booked' });

            // Add slot to doctor's slots_booked
            const doctorData = await doctorModel.findById(appointment.docId);
            let slots_booked = doctorData.slots_booked || {};
            if (slots_booked[appointment.slotDate]) {
                if (!slots_booked[appointment.slotDate].includes(appointment.slotTime)) slots_booked[appointment.slotDate].push(appointment.slotTime);
            } else {
                slots_booked[appointment.slotDate] = [appointment.slotTime];
            }
            await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked });

            res.json({
                success: true,
                message: 'Payment verified and appointment confirmed'
            });
        } else {
            // If payment failed, cancel the appointment and free up the slot
            const appointment = await appointmentModel.findById(appointmentId);
            
            if (appointment) {
                await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, status: 'cancelled' });

                // Free up the slot in doctor's record
                const doctorData = await doctorModel.findById(appointment.docId);
                let slots_booked = doctorData.slots_booked || {};
                if (slots_booked[appointment.slotDate]) {
                    slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(
                        e => e !== appointment.slotTime
                    );
                    await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked });
                }
            }

            res.json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Process payment for existing unpaid appointment
const payForAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Get appointment details
        const appointment = await appointmentModel.findById(appointmentId);

        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.payment) {
            return res.json({ success: false, message: 'Appointment already paid' });
        }

        if (appointment.cancelled) {
            return res.json({ success: false, message: 'Appointment is cancelled' });
        }

        // Create Stripe payment intent (INR, minimum ₹50 per Stripe rules)
        const chargeAmount = Math.max(Math.round(appointment.amount), 50)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: chargeAmount * 100, // paise
            currency: 'inr',
            metadata: {
                appointmentId: appointment._id.toString(),
                userId: appointment.userId,
                docId: appointment.docId,
                doctorName: appointment.docData.name,
                patientName: appointment.userData.name,
            },
            description: `Payment for appointment with Dr. ${appointment.docData.name} on ${appointment.slotDate} at ${appointment.slotTime}`,
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            appointmentId: appointment._id,
            message: 'Payment intent created successfully'
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { createPaymentIntent, verifyPayment, payForAppointment };
