import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const connectCloudinary = async () => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY
    });

    logger.info('Cloudinary configured')
    return cloudinary

}

export default connectCloudinary;