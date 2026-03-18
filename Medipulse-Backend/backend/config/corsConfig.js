import cors from 'cors'

const allowedOrigins = [
  'https://medipulse-frontend.onrender.com',
  'https://medipulse-admin.onrender.com',
  'https://medipulse-backend.onrender.com/',
  'http://localhost:5175/',
  'http://localhost:5174/',
  'http://localhost:5173/',
  'http://localhost:5176/',
  'http://localhost:4000/',
  'http://localhost:3000/'
]

const normalizeOrigin = (origin = '') => String(origin).replace(/\/$/, '')

const normalizedAllowedOrigins = new Set(allowedOrigins.map(normalizeOrigin))

const isAllowedOrigin = (origin) => {
  // Allow non-browser requests (no Origin header)
  if (!origin) return true

  if (normalizedAllowedOrigins.has(normalizeOrigin(origin))) return true

  // Allow any localhost dev origin, e.g. 3000, 5173, 5175, 5176
  return /^http:\/\/localhost:\d+$/.test(origin)
}

const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true)
    return
  }

  callback(new Error('Not allowed by CORS'))
}

const corsMiddleware = cors({
  origin: corsOriginHandler,
  credentials: true
})

const socketCorsOptions = {
  origin: corsOriginHandler,
  methods: ['GET', 'POST'],
  credentials: true
}

export { isAllowedOrigin, corsMiddleware, socketCorsOptions }
