import Fastify from 'fastify'
import fastifyJwt from 'fastify-jwt'
import fastifyCors from 'fastify-cors'
import fastifyHelmet from 'fastify-helmet'
import fastifyRateLimit from 'fastify-rate-limit'
import { PrismaClient } from '@prisma/client'
import { WebSocketManager } from './websocket'
import { authRoutes } from './routes/auth.routes'

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// ========================================
// Plugins
// ========================================
app.register(fastifyCors, { origin: '*' })
app.register(fastifyHelmet)
app.register(fastifyRateLimit, { 
  max: 100, 
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    success: false,
    message: 'Too many requests, please try again later',
  }),
})
app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'secret' })

// ========================================
// Health Check
// ========================================
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  websocket: wsManager?.getConnectedClients() || 0,
}))

// ========================================
// Register Auth Routes
// ========================================
app.register(authRoutes, { prefix: '/api' })

// ========================================
// Protected Route Example
// ========================================
app.get('/api/protected', { preHandler: app.authenticate }, async (request, reply) => {
  return {
    success: true,
    message: 'You have accessed a protected route!',
    user: request.user,
  }
})

// ========================================
// WebSocket Server
// ========================================
let wsManager: WebSocketManager

const start = async () => {
  try {
    await app.listen({ 
      port: parseInt(process.env.API_PORT || '3000'), 
      host: process.env.API_HOST || '0.0.0.0' 
    })
    
    wsManager = new WebSocketManager(app.server)
    
    console.log('🚀 API started on http://localhost:3000')
    console.log('🔌 WebSocket: ws://localhost:3000/ws')
    console.log('🔐 Auth endpoints:')
    console.log('   POST /api/auth/register')
    console.log('   POST /api/auth/login')
    console.log('   POST /api/auth/refresh')
    console.log('   POST /api/auth/logout')
    console.log('   POST /api/auth/change-password')
    console.log('   POST /api/auth/forgot-password')
    console.log('   POST /api/auth/reset-password')
    console.log('   GET  /api/auth/profile')
    console.log('   PUT  /api/auth/profile')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
