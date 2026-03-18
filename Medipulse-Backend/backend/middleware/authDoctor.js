import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

const authDoctor = async (req, res, next) => {
    const { dtoken } = req.headers
    if (!dtoken) {
        return res.json({ success: false, message: 'Not Authorized Login Again' })
    }
    try {
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        req.body.docId = token_decode.id
        next()
    } catch (error) {
        logger.error('authDoctor middleware error', { error: error.message })
        res.json({ success: false, message: error.message })
    }
}

export default authDoctor;