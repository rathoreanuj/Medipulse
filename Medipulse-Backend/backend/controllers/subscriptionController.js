import Stripe from 'stripe';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import { createNotification } from '../services/notificationService.js';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Pricing in cents (Stripe uses smallest currency unit)
const PLANS = {
    doctor_pro: { amount: 1199, label: 'Doctor Pro Plan – 1 Month', durationDays: 30 },
    patient_premium: { amount: 359, label: 'Patient Premium Plan – 1 Month', durationDays: 30 },
    featured_week: { amount: 599, label: 'Featured Doctor Listing – 1 Week', durationDays: 7 },
};

// ─── Doctor plan status ───────────────────────────────────────────────────────
const getDoctorPlanStatus = async (req, res) => {
    try {
        const { docId } = req.body;
        const doctor = await doctorModel.findById(docId).select('plan planExpiry isFeatured featuredUntil name');
        if (!doctor) return res.json({ success: false, message: 'Doctor not found' });

        const now = new Date();
        // Auto-expire plan if past expiry
        const isPlanActive = doctor.plan === 'pro' && doctor.planExpiry && doctor.planExpiry > now;
        const isFeaturedActive = doctor.isFeatured && doctor.featuredUntil && doctor.featuredUntil > now;

        res.json({
            success: true,
            plan: isPlanActive ? 'pro' : 'free',
            planExpiry: doctor.planExpiry,
            isFeatured: isFeaturedActive,
            featuredUntil: doctor.featuredUntil,
        });
    } catch (error) {
        logger.error('Subscription controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

// ─── Patient plan status ──────────────────────────────────────────────────────
const getPatientPlanStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select('plan planExpiry name');
        if (!user) return res.json({ success: false, message: 'User not found' });

        const now = new Date();
        const isPlanActive = user.plan === 'premium' && user.planExpiry && user.planExpiry > now;

        res.json({
            success: true,
            plan: isPlanActive ? 'premium' : 'free',
            planExpiry: user.planExpiry,
        });
    } catch (error) {
        logger.error('Subscription controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

// ─── Create Stripe payment intent for a subscription ─────────────────────────
const createSubscriptionPayment = async (req, res) => {
    try {
        const { type, docId, userId } = req.body; // type: 'doctor_pro' | 'patient_premium' | 'featured_week'

        const plan = PLANS[type];
        if (!plan) return res.json({ success: false, message: 'Invalid plan type' });

        let customerName = '';
        if (docId) {
            const doc = await doctorModel.findById(docId).select('name');
            customerName = doc?.name || '';
        } else if (userId) {
            const user = await userModel.findById(userId).select('name');
            customerName = user?.name || '';
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: plan.amount,
            currency: 'usd',
            metadata: { type, docId: docId || '', userId: userId || '', customerName },
            description: `${plan.label} – ${customerName}`,
        });

        res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (error) {
        logger.error('Subscription controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

// ─── Verify payment and activate subscription ─────────────────────────────────
const verifySubscriptionPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.json({ success: false, message: 'Payment not successful' });
        }

        const { type, docId, userId } = paymentIntent.metadata;
        const plan = PLANS[type];
        if (!plan) return res.json({ success: false, message: 'Invalid plan type' });

        const expiry = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);

        if (type === 'doctor_pro' && docId) {
            const doctor = await doctorModel.findByIdAndUpdate(docId, { plan: 'pro', planExpiry: expiry }).select('name');

            await createNotification({
                recipientType: 'admin',
                recipientId: 'global',
                type: 'premium-joined',
                title: 'Doctor joined premium',
                message: `${doctor?.name || 'A doctor'} activated Doctor Pro plan.`,
                link: '/revenue-dashboard',
                meta: { docId, plan: 'doctor_pro', expiry }
            });

            return res.json({ success: true, message: 'Doctor Pro plan activated', expiry });
        }

        if (type === 'featured_week' && docId) {
            await doctorModel.findByIdAndUpdate(docId, { isFeatured: true, featuredUntil: expiry });
            return res.json({ success: true, message: 'Featured listing activated', expiry });
        }

        if (type === 'patient_premium' && userId) {
            const user = await userModel.findByIdAndUpdate(userId, { plan: 'premium', planExpiry: expiry }).select('name');

            await createNotification({
                recipientType: 'admin',
                recipientId: 'global',
                type: 'premium-joined',
                title: 'Patient joined premium',
                message: `${user?.name || 'A patient'} activated Premium plan.`,
                link: '/revenue-dashboard',
                meta: { userId, plan: 'patient_premium', expiry }
            });

            return res.json({ success: true, message: 'Patient Premium plan activated', expiry });
        }

        res.json({ success: false, message: 'Could not activate plan – missing ID' });
    } catch (error) {
        logger.error('Subscription controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

// ─── Admin Revenue Stats ──────────────────────────────────────────────────────
const getAdminRevenueStats = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({ payment: true, cancelled: false }).sort({ date: -1 });
        const doctors = await doctorModel.find({}).select('name plan planExpiry isFeatured featuredUntil');
        const users = await userModel.find({}).select('plan planExpiry');

        const now = new Date();

        // Commission stats
        const totalCommission = appointments.reduce((sum, a) => sum + (a.commission || 0), 0);
        const totalRevenue = appointments.reduce((sum, a) => sum + (a.amount || 0), 0);

        // Subscription stats
        const activeDoctorPro = doctors.filter(d => d.plan === 'pro' && d.planExpiry && d.planExpiry > now).length;
        const activeFeatured = doctors.filter(d => d.isFeatured && d.featuredUntil && d.featuredUntil > now).length;
        const activePremiumPatients = users.filter(u => u.plan === 'premium' && u.planExpiry && u.planExpiry > now).length;

        // Estimated monthly subscription revenue (current active subs × monthly price in INR)
        const doctorSubRevenue = activeDoctorPro * 999;
        const featuredRevenue = activeFeatured * 499;
        const patientSubRevenue = activePremiumPatients * 299;

        // Appointment count breakdown
        const paidAppointments = appointments.length;
        const commissionBreakdown = appointments.slice(0, 20).map(a => ({
            id: a._id,
            amount: a.amount,
            commission: a.commission,
            date: a.date,
            patientName: a.userData?.name,
            doctorName: a.docData?.name,
        }));

        res.json({
            success: true,
            stats: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalCommission: Math.round(totalCommission * 100) / 100,
                paidAppointments,
                activeDoctorPro,
                activeFeatured,
                activePremiumPatients,
                doctorSubRevenue: Math.round(doctorSubRevenue * 100) / 100,
                featuredRevenue: Math.round(featuredRevenue * 100) / 100,
                patientSubRevenue: Math.round(patientSubRevenue * 100) / 100,
                totalSubscriptionRevenue: Math.round((doctorSubRevenue + featuredRevenue + patientSubRevenue) * 100) / 100,
            },
            recentCommissions: commissionBreakdown,
        });
    } catch (error) {
        logger.error('Subscription controller error', { error: error.message });
        res.json({ success: false, message: error.message });
    }
};

export {
    getDoctorPlanStatus,
    getPatientPlanStatus,
    createSubscriptionPayment,
    verifySubscriptionPayment,
    getAdminRevenueStats,
};
