import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
    mongoose.connection.on('connected', () => logger.info('Database connected'))
    const connection = await mongoose.connect(`${process.env.MONGODB_URI}/Medipulse`)
    return connection

}

export default connectDB;