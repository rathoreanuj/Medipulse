import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error', { error: error.message });
        process.exit(1);
    }
};

// Define appointment schema
const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    docId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: { type: Object, required: true },
    docData: { type: Object, required: true },
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
});

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);

// Fix existing completed appointments
const fixCompletedAppointments = async () => {
    try {
        await connectDB();
        
        logger.info('Searching for completed appointments with unpaid status');
        
        // Find all appointments that are completed but payment is false
        const appointmentsToFix = await appointmentModel.find({
            isCompleted: true,
            payment: false,
            cancelled: false
        });
        
        if (appointmentsToFix.length === 0) {
            logger.info('No appointments need fixing. All completed appointments are marked as paid.');
            process.exit(0);
        }
        
        logger.info('Found completed appointments with unpaid status', { count: appointmentsToFix.length });
        
        appointmentsToFix.forEach((apt, index) => {
            logger.info('Appointment to fix', {
                index: index + 1,
                doctor: apt.docData.name,
                patient: apt.userData.name,
                slotDate: apt.slotDate,
                slotTime: apt.slotTime,
                amount: apt.amount
            });
        });
        
        // Update all these appointments
        const result = await appointmentModel.updateMany(
            {
                isCompleted: true,
                payment: false,
                cancelled: false
            },
            {
                $set: { payment: true }
            }
        );
        
        logger.info('Successfully updated appointments', {
            appointmentsFound: appointmentsToFix.length,
            appointmentsUpdated: result.modifiedCount,
            status: 'All completed appointments are now marked as PAID'
        });
        
        process.exit(0);
        
    } catch (error) {
        logger.error('Error fixing appointments', { error: error.message });
        process.exit(1);
    }
};

// Run the script
fixCompletedAppointments();
