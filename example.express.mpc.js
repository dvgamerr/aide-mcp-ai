import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

// Create an MCP server with implementation details
const getServer = () => {
  // Create an MCP server with implementation details
  const server = new McpServer(
    {
      name: 'stateless-streamable-http-server',
      version: '1.0.0',
    },
    { capabilities: { logging: {} } },
  )

  // Register a simple prompt
  server.prompt(
    'greeting-template',
    'A simple greeting prompt template',
    {
      name: z.string().describe('Name to include in greeting'),
    },
    async ({ name }) => {
      return {
        messages: [
          {
            content: {
              text: `Please greet ${name} in a friendly manner.`,
              type: 'text',
            },
            role: 'user',
          },
        ],
      }
    },
  )

  // Register a simple tool that returns a greeting
  server.registerTool(
    'fetch-weather',
    {
      description: 'Get weather data for a city',
      inputSchema: { city: z.string() },
      title: 'Weather Fetcher',
    },
    async ({ city }) => {
      const response = await fetch(`https://api.weather.com/${city}`)
      const data = await response.text()
      return {
        content: [{ text: data, type: 'text' }],
      }
    },
  )
  // Create a simple resource at a fixed URI
  server.resource('greeting-resource', 'https://example.com/greetings/default', { mimeType: 'text/plain' }, async () => {
    return {
      contents: [
        {
          text: 'Hello, world!',
          uri: 'https://example.com/greetings/default',
        },
      ],
    }
  })
  return server
}

const app = express()
app.use(express.json())

// Configure CORS to expose Mcp-Session-Id header for browser-based clients
app.use(
  cors({
    exposedHeaders: ['Mcp-Session-Id'],
    origin: '*', // Allow all origins - adjust as needed for production
  }),
)

// Map to store transports by session ID
const transports = {}

app.post('/mcp', async (req, res) => {
  console.log('Received MCP request:', req.body)
  try {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id']
    let transport

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - use JSON response mode
      transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true, // Enable JSON response mode
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID when session is initialized
          // This avoids race conditions where requests might come in before the session is stored
          console.log(`Session initialized with ID: ${sessionId}`)
          transports[sessionId] = transport
        },
        sessionIdGenerator: () => randomUUID(),
      })

      // Connect the transport to the MCP server BEFORE handling the request
      const server = getServer()
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
      return // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
        jsonrpc: '2.0',
      })
      return
    }

    // Handle the request with existing transport - no need to reconnect
    await transport.handleRequest(req, res, req.body)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
        jsonrpc: '2.0',
      })
    }
  }
})

// Handle GET requests for SSE streams according to spec
app.get('/mcp', async (req, res) => {
  // Since this is a very simple example, we don't support GET requests for this server
  // The spec requires returning 405 Method Not Allowed in this case
  res.status(405).set('Allow', 'POST').send('Method Not Allowed')
})

// Start the server
const PORT = 3000
app.listen(PORT, (error) => {
  if (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
  console.log(`MCP Streamable HTTP Server listening on port ${PORT}`)
})

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...')
  process.exit(0)
})
