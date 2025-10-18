import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
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
        
        console.log('\n🔍 Searching for completed appointments with unpaid status...\n');
        
        // Find all appointments that are completed but payment is false
        const appointmentsToFix = await appointmentModel.find({
            isCompleted: true,
            payment: false,
            cancelled: false
        });
        
        if (appointmentsToFix.length === 0) {
            console.log('✅ No appointments need fixing. All completed appointments are marked as paid.');
            process.exit(0);
        }
        
        console.log(`📋 Found ${appointmentsToFix.length} completed appointment(s) with unpaid status:\n`);
        
        appointmentsToFix.forEach((apt, index) => {
            console.log(`${index + 1}. Doctor: ${apt.docData.name}`);
            console.log(`   Patient: ${apt.userData.name}`);
            console.log(`   Date: ${apt.slotDate} at ${apt.slotTime}`);
            console.log(`   Amount: ₹${apt.amount}`);
            console.log(`   Status: Completed ✓, Payment: Unpaid ✗\n`);
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
        
        console.log(`✅ Successfully updated ${result.modifiedCount} appointment(s)!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Appointments found: ${appointmentsToFix.length}`);
        console.log(`   - Appointments updated: ${result.modifiedCount}`);
        console.log(`   - Status: All completed appointments are now marked as PAID ✓\n`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error fixing appointments:', error);
        process.exit(1);
    }
};

// Run the script
fixCompletedAppointments();
