import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'
import {
  createStrategy,
  getStrategies,
  getStrategy,
  updateStrategy,
  toggleStrategy,
  deleteStrategy,
  runStrategy,
  getStrategyLogs,
  getStrategyTemplates,
} from '../services/strategy.service'
import { z } from 'zod'

// ========================================
// Validation Schemas
// ========================================
const createStrategySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['MA_CROSSOVER', 'RSI_OVERSOLD', 'MACD_SIGNAL', 'BOLLINGER_BANDS', 'CUSTOM']),
  config: z.any(),
})

const updateStrategySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  config: z.any().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED']).optional(),
})

export async function strategyRoutes(app: FastifyInstance) {
  
  // ========================================
  // 1. สร้างกลยุทธ์
  // ========================================
  app.post('/strategies', { preHandler: authenticate }, async (request, reply) => {
    try {
      const input = createStrategySchema.parse(request.body)
      const strategy = await createStrategy(request.user!.userId, input)
      
      return reply.status(201).send({
        success: true,
        message: 'Strategy created successfully',
        data: { strategy },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to create strategy',
      })
    }
  })

  // ========================================
  // 2. ดูกลยุทธ์ทั้งหมด
  // ========================================
  app.get('/strategies', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { status, type, isActive } = request.query as any
      const strategies = await getStrategies(request.user!.userId, {
        status,
        type,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      })
      
      return reply.send({
        success: true,
        data: { strategies, count: strategies.length },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch strategies',
      })
    }
  })

  // ========================================
  // 3. ดูกลยุทธ์เดียว
  // ========================================
  app.get('/strategies/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const strategy = await getStrategy(id, request.user!.userId)
      
      return reply.send({
        success: true,
        data: { strategy },
      })
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        message: error.message || 'Strategy not found',
      })
    }
  })

  // ========================================
  // 4. อัปเดตกลยุทธ์
  // ========================================
  app.put('/strategies/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const input = updateStrategySchema.parse(request.body)
      const strategy = await updateStrategy(id, request.user!.userId, input)
      
      return reply.send({
        success: true,
        message: 'Strategy updated successfully',
        data: { strategy },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to update strategy',
      })
    }
  })

  // ========================================
  // 5. เปิด/ปิดกลยุทธ์
  // ========================================
  app.post('/strategies/:id/toggle', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const strategy = await toggleStrategy(id, request.user!.userId)
      
      return reply.send({
        success: true,
        message: `Strategy ${strategy.isActive ? 'activated' : 'paused'} successfully`,
        data: { strategy },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to toggle strategy',
      })
    }
  })

  // ========================================
  // 6. ลบกลยุทธ์
  // ========================================
  app.delete('/strategies/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      await deleteStrategy(id, request.user!.userId)
      
      return reply.send({
        success: true,
        message: 'Strategy deleted successfully',
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to delete strategy',
      })
    }
  })

  // ========================================
  // 7. เรียกใช้กลยุทธ์
  // ========================================
  app.post('/strategies/:id/run', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const result = await runStrategy(id, request.user!.userId)
      
      return reply.send({
        success: true,
        message: 'Strategy executed successfully',
        data: result,
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to run strategy',
      })
    }
  })

  // ========================================
  // 8. ดู Logs ของกลยุทธ์
  // ========================================
  app.get('/strategies/:id/logs', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { limit } = request.query as { limit?: string }
      const logs = await getStrategyLogs(
        id, 
        request.user!.userId, 
        limit ? parseInt(limit) : 50
      )
      
      return reply.send({
        success: true,
        data: { logs, count: logs.length },
      })
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Failed to fetch logs',
      })
    }
  })

  // ========================================
  // 9. ดู Strategy Templates
  // ========================================
  app.get('/strategies/templates', { preHandler: authenticate }, async (request, reply) => {
    try {
      const templates = getStrategyTemplates()
      
      return reply.send({
        success: true,
        data: { templates },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch templates',
      })
    }
  })
}
