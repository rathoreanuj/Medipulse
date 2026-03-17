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
        const { userId, docId, slotDate, slotTime, consultationType } = req.body;

        // Get doctor and user data
        const docData = await doctorModel.findById(docId).select("-password");
        const userData = await userModel.findById(userId).select("-password");

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' });
        }

        // Check if slot is available
        let slots_booked = docData.slots_booked;
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' });
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }

        // Video consultations get a discounted fee + higher admin commission
        const isVideo = consultationType === 'video';
        const discountPercent = isVideo ? Number(process.env.VIDEO_DISCOUNT_PERCENT || 20) : 0;
        const commissionRate  = isVideo ? Number(process.env.VIDEO_COMMISSION_RATE  || 20) : 10;
        const finalAmount     = Math.round(docData.fees * (1 - discountPercent / 100) * 100) / 100;

        // Create appointment first
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: {
                _id: docData._id,
                name: docData.name,
                email: docData.email,
                image: docData.image,
                speciality: docData.speciality,
                degree: docData.degree,
                experience: docData.experience,
                about: docData.about,
                fees: docData.fees,
                address: docData.address,
            },
            amount: finalAmount,
            slotTime,
            slotDate,
            date: Date.now(),
            payment: false,
            commissionRate,
            consultationType: isVideo ? 'video' : 'in-person',
            videoRoomId: isVideo ? `video-${randomUUID()}` : null,
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's booked slots
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Create Stripe payment intent (INR, minimum ₹50 per Stripe rules)
        const chargeAmount = Math.max(Math.round(finalAmount), 50)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: chargeAmount * 100, // Stripe INR uses paise (1 INR = 100 paise)
            currency: 'inr',
            metadata: {
                appointmentId: newAppointment._id.toString(),
                userId: userId,
                docId: docId,
                doctorName: docData.name,
                patientName: userData.name,
                consultationType: consultationType || 'in-person',
                discountPercent: String(discountPercent),
            },
            description: `${isVideo ? 'Video' : 'In-Person'} appointment with Dr. ${docData.name} on ${slotDate} at ${slotTime}${isVideo ? ` (${discountPercent}% video discount applied)` : ''}`,
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            appointmentId: newAppointment._id,
            originalFee: docData.fees,
            finalAmount: chargeAmount,
            discountPercent,
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
            // Update appointment payment status
            const appointment = await appointmentModel.findById(appointmentId);
            const commissionRate = appointment?.commissionRate ?? 10;
            const commission = Math.round(((appointment?.amount || 0) * commissionRate / 100) * 100) / 100;
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true, commission });

            res.json({
                success: true,
                message: 'Payment verified and appointment confirmed'
            });
        } else {
            // If payment failed, cancel the appointment and free up the slot
            const appointment = await appointmentModel.findById(appointmentId);
            
            if (appointment) {
                await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

                // Free up the slot
                const doctorData = await doctorModel.findById(appointment.docId);
                let slots_booked = doctorData.slots_booked;
                slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(
                    e => e !== appointment.slotTime
                );
                await doctorModel.findByIdAndUpdate(appointment.docId, { slots_booked });
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
