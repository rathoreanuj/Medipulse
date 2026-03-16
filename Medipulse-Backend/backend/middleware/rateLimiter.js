import rateLimit from 'express-rate-limit'

const isProduction = process.env.NODE_ENV === 'production'

const isLocalRequest = (req) => {
    const ip = req.ip || ''
    return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1')
}

// Global limiter — applied to all routes as a safety baseline
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || (isProduction ? 300 : 2000),
    standardHeaders: true,
    legacyHeaders: false,
    // Do not throttle local development traffic.
    skip: (req) => !isProduction && isLocalRequest(req),
    message: { success: false, message: 'Too many requests, please try again after 15 minutes.' }
})

// Auth limiter — strict, for login & register to block brute force
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' }
})

// Payment limiter — prevent payment endpoint abuse
export const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many payment requests, please try again after an hour.' }
})
