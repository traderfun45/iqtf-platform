import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'
import { getDashboardSummary, getEquityCurve, getPerformanceMetrics } from '../services/dashboard.service'

export async function dashboardRoutes(app: FastifyInstance) {
  
  // ========================================
  // 1. Dashboard Summary (ภาพรวม)
  // ========================================
  app.get('/dashboard', { preHandler: authenticate }, async (request, reply) => {
    try {
      const summary = await getDashboardSummary(request.user!.userId)
      
      return reply.send({
        success: true,
        data: summary,
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch dashboard',
      })
    }
  })

  // ========================================
  // 2. Equity Curve (กราฟ)
  // ========================================
  app.get('/dashboard/equity', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { days } = request.query as { days?: string }
      const data = await getEquityCurve(
        request.user!.userId,
        days ? parseInt(days) : 30
      )
      
      return reply.send({
        success: true,
        data,
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch equity curve',
      })
    }
  })

  // ========================================
  // 3. Performance Metrics
  // ========================================
  app.get('/dashboard/performance', { preHandler: authenticate }, async (request, reply) => {
    try {
      const metrics = await getPerformanceMetrics(request.user!.userId)
      
      return reply.send({
        success: true,
        data: metrics,
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch performance metrics',
      })
    }
  })
}
