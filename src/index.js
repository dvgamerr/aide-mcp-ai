import { Elysia } from 'elysia'
import { mcp } from 'elysia-mcp'
import { z } from 'zod'

import { name, version } from '../package.json'
import { logger } from './helper/config'
import { setupGracefulShutdown } from './helper/graceful'

logger.info(` ${name}@${version} starting...`)

// Setup graceful shutdown handlers
setupGracefulShutdown(() => {
  logger.info('graceful shutdown')
})

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .use(
    mcp({
      capabilities: {
        logging: {},
        prompts: {},
        resources: {},
        tools: {},
      },
      serverInfo: {
        name: 'my-mcp-server',
        version: '1.0.0',
      },
      setupServer: async (server) => {
        // Register your MCP tools, resources, and prompts here
        server.tool(
          'echo',
          {
            text: z.string().describe('Text to echo back'),
          },
          async (args) => {
            return {
              content: [{ text: `Echo: ${args.text}`, type: 'text' }],
            }
          },
        )
      },
    }),
  )
  .listen(3000)

logger.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
