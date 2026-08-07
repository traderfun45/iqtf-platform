import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth.middleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// 1. ดูสินทรัพย์ทั้งหมด
// ========================================
export async function assetRoutes(app: FastifyInstance) {
  
  app.get('/assets', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { type, exchange, search } = request.query as any
      
      const where: any = {}
      if (type) where.type = type
      if (exchange) where.exchange = exchange
      if (search) {
        where.OR = [
          { symbol: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ]
      }

      const assets = await prisma.asset.findMany({
        where,
        orderBy: { symbol: 'asc' },
      })

      return reply.send({
        success: true,
        data: { assets, count: assets.length },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch assets',
      })
    }
  })

  // ========================================
  // 2. ดู Asset เดียว
  // ========================================
  app.get('/assets/:symbol', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string }
      const asset = await prisma.asset.findUnique({
        where: { symbol: symbol.toUpperCase() },
      })

      if (!asset) {
        return reply.status(404).send({
          success: false,
          message: 'Asset not found',
        })
      }

      return reply.send({
        success: true,
        data: { asset },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch asset',
      })
    }
  })

  // ========================================
  // 3. ดูราคาสินทรัพย์ (Real-time)
  // ========================================
  app.get('/assets/:symbol/price', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string }
      
      // ดึงราคาจาก Price Service
      const { priceService } = await import('../websocket/services/price.service')
      const price = priceService.getPrice(symbol.toUpperCase())

      if (!price) {
        return reply.status(404).send({
          success: false,
          message: 'Price data not available',
        })
      }

      return reply.send({
        success: true,
        data: { price },
      })
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch price',
      })
    }
  })
}
