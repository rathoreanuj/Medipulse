import Stripe from 'stripe';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe payment intent for appointment
const createPaymentIntent = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

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
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            payment: false // Will be updated after successful payment
        };

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // Update doctor's booked slots
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(docData.fees * 100), // Stripe expects amount in cents
            currency: 'usd',
            metadata: {
                appointmentId: newAppointment._id.toString(),
                userId: userId,
                docId: docId,
                doctorName: docData.name,
                patientName: userData.name,
            },
            description: `Appointment with Dr. ${docData.name} on ${slotDate} at ${slotTime}`,
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            appointmentId: newAppointment._id,
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
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

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

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(appointment.amount * 100), // Stripe expects amount in cents
            currency: 'usd',
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
