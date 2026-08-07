import Fastify from 'fastify'
import fastifyJwt from 'fastify-jwt'
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from 'fastify-rate-limit'
import { PrismaClient } from '@prisma/client'
import { WebSocketManager } from './websocket'
import { authRoutes } from './routes/auth.routes'
import { tradingRoutes } from './routes/trading.routes'
import { strategyRoutes } from './routes/strategy.routes'
import { backtestRoutes } from './routes/backtest.routes'
import { assetRoutes } from './routes/asset.routes'

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// ========================================
// Plugins
// ========================================
app.register(fastifyCors, { origin: '*' })
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
// Register Routes (API)
// ========================================
app.register(authRoutes, { prefix: '/api' })
app.register(tradingRoutes, { prefix: '/api' })
app.register(strategyRoutes, { prefix: '/api' })
app.register(backtestRoutes, { prefix: '/api' })
app.register(assetRoutes, { prefix: '/api' })

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
      host: process.env.API_HOST || '0.0.0.0',
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
    console.log('📈 Trading endpoints:')
    console.log('   POST /api/trading/orders')
    console.log('   GET  /api/trading/orders')
    console.log('   DELETE /api/trading/orders/:id')
    console.log('   GET  /api/trading/portfolio')
    console.log('   GET  /api/trading/history')
    console.log('📊 Strategy endpoints:')
    console.log('   POST /api/strategies')
    console.log('   GET  /api/strategies')
    console.log('   GET  /api/strategies/templates')
    console.log('   GET  /api/strategies/:id')
    console.log('   PUT  /api/strategies/:id')
    console.log('   POST /api/strategies/:id/toggle')
    console.log('   POST /api/strategies/:id/run')
    console.log('   GET  /api/strategies/:id/logs')
    console.log('   DELETE /api/strategies/:id')
    console.log('📉 Backtest endpoints:')
    console.log('   POST /api/backtest/run')
    console.log('   GET  /api/backtest/history')
    console.log('   GET  /api/backtest/:id')
    console.log('🪙 Asset endpoints:')
    console.log('   GET  /api/assets')
    console.log('   GET  /api/assets/:symbol')
    console.log('   GET  /api/assets/:symbol/price')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
