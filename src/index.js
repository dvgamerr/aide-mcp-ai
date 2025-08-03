import { name, version } from '../package.json'
import { logger } from './helper/config'
import { setupGracefulShutdown } from './helper/graceful'

logger.info(` ${name}@${version} starting...`)

setupGracefulShutdown(() => {
  logger.info('graceful shutdown')
})

logger.info(`🦊 Elysia is running`)
