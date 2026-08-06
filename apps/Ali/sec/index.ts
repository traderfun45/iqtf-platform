import Fastify from 'fastify'
import fastifyJwt from 'fastify-jwt'
import fastifyCors from 'fastify-cors'
import fastifyHelmet from 'fastify-helmet'
import fastifyRateLimit from 'fastify-rate-limit'
import { PrismaClient } from '@prisma/client'
import { WebSocketManager } from './websocket'

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// Plugins
app.register(fastifyCors, { origin: '*' })
app.register(fastifyHelmet)
app.register(fastifyRateLimit, { max: 100, timeWindow: '1 minute' })
app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'secret' })

// Health check
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  websocket: wsManager?.getConnectedClients() || 0
}))

// API Routes
app.get('/trades', async (request, reply) => {
  const trades = await prisma.trade.findMany()
  return { trades }
})

app.post('/trades', async (request, reply) => {
  const { symbol, side, amount, price } = request.body as any
  const trade = await prisma.trade.create({
    data: {
      userId: 'user_id_here',
      symbol,
      side,
      amount: parseFloat(amount),
      price: parseFloat(price),
      status: 'OPEN'
    }
  })
  return { trade }
})

// WebSocket Server
let wsManager: WebSocketManager

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    wsManager = new WebSocketManager(app.server)
    console.log('🚀 API started on http://localhost:3000')
    console.log('🔌 WebSocket: ws://localhost:3000/ws')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
