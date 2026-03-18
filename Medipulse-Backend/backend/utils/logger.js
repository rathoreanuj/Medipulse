const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

const envLevel = String(process.env.LOG_LEVEL || 'info').toLowerCase()
const activeLevel = LOG_LEVELS[envLevel] ?? LOG_LEVELS.info

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString()
  const levelTag = level.toUpperCase()

  if (!meta) {
    return `${timestamp} [${levelTag}] ${message}`
  }

  return `${timestamp} [${levelTag}] ${message} ${JSON.stringify(meta)}`
}

const log = (level, message, meta) => {
  if ((LOG_LEVELS[level] ?? LOG_LEVELS.info) > activeLevel) return

  const output = formatMessage(level, message, meta)

  if (level === 'error') {
    console.error(output)
    return
  }

  if (level === 'warn') {
    console.warn(output)
    return
  }

  console.info(output)
}

const logger = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta)
}

export default logger