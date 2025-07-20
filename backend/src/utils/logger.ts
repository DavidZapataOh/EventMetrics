import pino from 'pino'
import pretty from 'pino-pretty'

const isDev = process.env.NODE_ENV === 'development'

const prettyOptions = {
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname'
}

const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')
}

export const logger = isDev
  ? pino(
      loggerConfig,
      pretty(prettyOptions)
    )
  : pino(loggerConfig)
