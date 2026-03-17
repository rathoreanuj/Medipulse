// One-time script to update all doctor fees to INR values (ESM compatible)
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const fees = [1000, 2000, 3000, 4000, 5000, 1500, 2500, 3500, 4500]

async function updateFees() {
  await mongoose.connect(`${process.env.MONGODB_URI}/Medipulse`)
  console.log('Connected to MongoDB')

  // import the Doctor model (ESM)
  const { default: Doctor } = await import('./models/doctorModel.js')
  const doctors = await Doctor.find({}).sort({ createdAt: 1 })

  console.log(`Found ${doctors.length} doctors`)

  for (let i = 0; i < doctors.length; i++) {
    const fee = fees[i % fees.length]
    await Doctor.findByIdAndUpdate(doctors[i]._id, { fees: fee })
    console.log(`Updated Dr. ${doctors[i].name} → ₹${fee}`)
  }

  console.log('Done!')
  await mongoose.disconnect()
}

updateFees().catch(err => {
  console.error(err)
  process.exit(1)
})
