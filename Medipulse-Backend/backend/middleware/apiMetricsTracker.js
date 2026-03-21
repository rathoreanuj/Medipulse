import analyticsEventModel from '../models/analyticsEventModel.js'
import logger from '../utils/logger.js'

const AUTH_PATH_PATTERN = /\/(login|register|verify-otp|google-auth|forgot-password|reset-password)(\/|$)/i

const stripQuery = (url = '') => url.split('?')[0] || '/'

const apiMetricsTracker = (req, res, next) => {
  if (!req.originalUrl?.startsWith('/api/')) {
    return next()
  }

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    if (typeof body?.success === 'boolean') {
      res.locals.responseSuccess = body.success
    }
    return originalJson(body)
  }

  res.on('finish', () => {
    const endpoint = stripQuery(req.originalUrl)
    const responseSuccess = typeof res.locals.responseSuccess === 'boolean' ? res.locals.responseSuccess : null
    const success = responseSuccess ?? (res.statusCode >= 200 && res.statusCode < 400)
    const category = AUTH_PATH_PATTERN.test(endpoint) ? 'auth' : 'api'

    analyticsEventModel.create({
      category,
      endpoint,
      method: req.method,
      success,
      statusCode: res.statusCode,
      responseSuccess,
    }).catch((error) => {
      logger.warn('API metrics tracker write failed', { error: error.message, endpoint, method: req.method })
    })
  })

  next()
}

export default apiMetricsTracker