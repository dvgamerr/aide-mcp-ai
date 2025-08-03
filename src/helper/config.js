import pino from 'pino'

import { name, version } from '../../package.json'

// const createRequestHeaders = (headers) => ({
//   authorization: headers?.authorization,
//   'content-type': 'application/json',
//   'user-agent': userAgent,
// })

// Configuration constants
export const PORT = Bun.env.PORT || 3000
export const userAgent = `aide-${name}/${version}`

// Logger instance
export const logger = pino({
  level: Bun.env.LOG_LEVEL || 'info',
})

export const parseDatabaseUrl = (url) => {
  const uri = new URL(url)
  return {
    database: uri.pathname.split('/')[1],
    host: uri.hostname,
    password: uri.password,
    port: uri.port,
    ssl: false,
    user: uri.username,
  }
}
