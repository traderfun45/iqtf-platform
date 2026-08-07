import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'
import {
  runBacktest,
  getBacktestHistory,
  getBacktest,
} from '../services/backtest.service'
import { z } from 'zod'

// ========================================
// Validation Schemas
// ========================================
const runBacktestSchema = z.object({
  strategyId: z.string().optional(),
  strategyConfig: z.any().optional(),
  symbol: z.string().min(1, 'Symbol is required'),
  startDate: z.string().transform(v => new Date(v)),
  endDate: z.string().transform(v => new Date(v)),
  initialCapital: z.number().positive().default(10000),
  timeframe: z.string().default('1h'),
  commission: z.number().min(0).max(0.01).default(0.001),
})

export async function backtestRoutes(app: FastifyInstance) {
  
  // ========================================
  // 1. เรียกใช้ Backtest
  // ========================================
  app.post('/backtest/run', { preHandler: authenticate }, async (request, reply) => {
    try {
      const input = runBacktestSchema.parse(request.body)
      const result = await runBacktest(request.user!.userId, input)
      
      return reply.send({
        success: true,
        message: 'Backtest completed successfully',
        data: result,
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Backtest failed',
      })
    }
  })

  // ========================================
  // 2. ดูประวัติ Backtest
  // ========================================
  app.get('/backtest/history', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { symbol, limit } = request.query as any
      const backtests = await getBacktestHistory(request.user!.userId, {
        symbol,
        limit: limit ? parseInt(limit) : 20,
      })
      
      return reply.send({
        success: true,
        data: { backtests, count: backtests.length },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch backtest history',
      })
    }
  })

  // ========================================
  // 3. ดู Backtest เดียว
  // ========================================
  app.get('/backtest/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const backtest = await getBacktest(id, request.user!.userId)
      
      return reply.send({
        success: true,
        data: { backtest },
      })
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Backtest not found',
      })
    }
  })
}
