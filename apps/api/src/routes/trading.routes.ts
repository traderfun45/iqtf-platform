import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'
import {
  createOrder,
  getOrders,
  cancelOrder,
  getPortfolio,
  getTradeHistory,
} from '../services/trading.service'
import { z } from 'zod'

// ========================================
// Validation Schemas
// ========================================
const createOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['BUY', 'SELL']),
  type: z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
})

export async function tradingRoutes(app: FastifyInstance) {
  
  // ========================================
  // 1. สร้างคำสั่งซื้อขาย
  // ========================================
  app.post('/trading/orders', { preHandler: authenticate }, async (request, reply) => {
    try {
      const input = createOrderSchema.parse(request.body)
      const order = await createOrder(request.user!.userId, input)
      
      return reply.status(201).send({
        success: true,
        message: 'Order created successfully',
        data: { order },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to create order',
      })
    }
  })

  // ========================================
  // 2. ดูคำสั่งซื้อขายทั้งหมด
  // ========================================
  app.get('/trading/orders', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { status, symbol, limit, offset } = request.query as any
      const orders = await getOrders(request.user!.userId, {
        status,
        symbol,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      })
      
      return reply.send({
        success: true,
        data: { orders, count: orders.length },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch orders',
      })
    }
  })

  // ========================================
  // 3. ยกเลิกคำสั่งซื้อขาย
  // ========================================
  app.delete('/trading/orders/:orderId', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { orderId } = request.params as { orderId: string }
      const order = await cancelOrder(orderId, request.user!.userId)
      
      return reply.send({
        success: true,
        message: 'Order cancelled successfully',
        data: { order },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to cancel order',
      })
    }
  })

  // ========================================
  // 4. ดูพอร์ตโฟลิโอ
  // ========================================
  app.get('/trading/portfolio', { preHandler: authenticate }, async (request, reply) => {
    try {
      const portfolio = await getPortfolio(request.user!.userId)
      
      return reply.send({
        success: true,
        data: { portfolio },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch portfolio',
      })
    }
  })

  // ========================================
  // 5. ดูประวัติการซื้อขาย
  // ========================================
  app.get('/trading/history', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { symbol, limit, offset } = request.query as any
      const trades = await getTradeHistory(request.user!.userId, {
        symbol,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      })
      
      return reply.send({
        success: true,
        data: { trades, count: trades.length },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch trade history',
      })
    }
  })
}
