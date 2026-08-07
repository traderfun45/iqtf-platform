import { PrismaClient, StrategyType, StrategyStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// 1. สร้างกลยุทธ์
// ========================================
export const createStrategy = async (userId: string, input: {
  name: string
  description?: string
  type: StrategyType
  config: any
}) => {
  const strategy = await prisma.strategy.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      type: input.type,
      config: input.config,
      status: StrategyStatus.DRAFT,
    }
  })

  return strategy
}

// ========================================
// 2. ดูกลยุทธ์ทั้งหมด
// ========================================
export const getStrategies = async (userId: string, filters?: {
  status?: StrategyStatus
  type?: StrategyType
  isActive?: boolean
}) => {
  const where: any = { userId }
  
  if (filters?.status) where.status = filters.status
  if (filters?.type) where.type = filters.type
  if (filters?.isActive !== undefined) where.isActive = filters.isActive

  const strategies = await prisma.strategy.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return strategies
}

// ========================================
// 3. ดูกลยุทธ์เดียว
// ========================================
export const getStrategy = async (strategyId: string, userId: string) => {
  const strategy = await prisma.strategy.findFirst({
    where: {
      id: strategyId,
      userId,
    },
    include: {
      strategyLogs: {
        orderBy: { timestamp: 'desc' },
        take: 20,
      }
    }
  })

  if (!strategy) throw new Error('Strategy not found')
  return strategy
}

// ========================================
// 4. อัปเดตกลยุทธ์
// ========================================
export const updateStrategy = async (
  strategyId: string, 
  userId: string, 
  data: {
    name?: string
    description?: string
    config?: any
    isActive?: boolean
    status?: StrategyStatus
  }
) => {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId }
  })

  if (!strategy) throw new Error('Strategy not found')

  return await prisma.strategy.update({
    where: { id: strategyId },
    data,
  })
}

// ========================================
// 5. เปิด/ปิดกลยุทธ์
// ========================================
export const toggleStrategy = async (strategyId: string, userId: string) => {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId }
  })

  if (!strategy) throw new Error('Strategy not found')

  return await prisma.strategy.update({
    where: { id: strategyId },
    data: {
      isActive: !strategy.isActive,
      status: strategy.isActive ? StrategyStatus.PAUSED : StrategyStatus.ACTIVE,
    }
  })
}

// ========================================
// 6. ลบกลยุทธ์
// ========================================
export const deleteStrategy = async (strategyId: string, userId: string) => {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId }
  })

  if (!strategy) throw new Error('Strategy not found')
  if (strategy.status === 'ACTIVE') {
    throw new Error('Cannot delete active strategy. Please pause it first.')
  }

  await prisma.strategy.delete({
    where: { id: strategyId }
  })

  return { success: true }
}

// ========================================
// 7. เรียกใช้กลยุทธ์ (จำลอง)
// ========================================
export const runStrategy = async (strategyId: string, userId: string) => {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId }
  })

  if (!strategy) throw new Error('Strategy not found')
  if (!strategy.isActive) throw new Error('Strategy is not active')

  // จำลองการทำงาน (ในจริงจะใช้ data จริง)
  const signals = await simulateStrategy(strategy.config)

  // บันทึก Log
  for (const signal of signals) {
    await prisma.strategyLog.create({
      data: {
        strategyId: strategy.id,
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        quantity: signal.quantity,
        reason: signal.reason,
      }
    })
  }

  // อัปเดตกลยุทธ์
  await prisma.strategy.update({
    where: { id: strategyId },
    data: {
      lastRunAt: new Date(),
      totalTrades: { increment: signals.filter(s => s.action !== 'HOLD').length },
    }
  })

  return { signals, count: signals.length }
}

// ========================================
// 8. ดู Logs ของกลยุทธ์
// ========================================
export const getStrategyLogs = async (strategyId: string, userId: string, limit: number = 50) => {
  const strategy = await prisma.strategy.findFirst({
    where: { id: strategyId, userId }
  })

  if (!strategy) throw new Error('Strategy not found')

  return await prisma.strategyLog.findMany({
    where: { strategyId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

// ========================================
// Helper: จำลองกลยุทธ์
// ========================================
const simulateStrategy = async (config: any) => {
  // สร้างสัญญาณจำลอง
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
  const actions = ['BUY', 'SELL', 'HOLD']
  
  return symbols.map(symbol => ({
    symbol,
    action: actions[Math.floor(Math.random() * actions.length)],
    price: 100 + Math.random() * 100,
    quantity: Math.round((Math.random() * 0.01) * 1000) / 1000,
    reason: `Signal generated by strategy: ${config.name || 'Custom'}`,
  }))
}

// ========================================
// 9. Strategy Templates (ตัวอย่าง)
// ========================================
export const getStrategyTemplates = () => {
  return [
    {
      name: 'MA Crossover',
      type: 'MA_CROSSOVER',
      description: 'Buy when fast MA crosses above slow MA',
      config: {
        fastMA: 10,
        slowMA: 30,
        symbol: 'BTCUSDT',
        quantity: 0.001,
      }
    },
    {
      name: 'RSI Oversold/Overbought',
      type: 'RSI_OVERSOLD',
      description: 'Buy when RSI < 30, Sell when RSI > 70',
      config: {
        period: 14,
        oversold: 30,
        overbought: 70,
        symbol: 'ETHUSDT',
        quantity: 0.1,
      }
    },
    {
      name: 'MACD Signal',
      type: 'MACD_SIGNAL',
      description: 'Buy when MACD crosses above signal line',
      config: {
        fastMA: 12,
        slowMA: 26,
        signalMA: 9,
        symbol: 'SOLUSDT',
        quantity: 1,
      }
    },
    {
      name: 'Bollinger Bands',
      type: 'BOLLINGER_BANDS',
      description: 'Buy when price touches lower band',
      config: {
        period: 20,
        stdDev: 2,
        symbol: 'ADAUSDT',
        quantity: 100,
      }
    },
  ]
}
