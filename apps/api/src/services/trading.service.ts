import { PrismaClient, OrderSide, OrderType, OrderStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// 1. สร้างคำสั่งซื้อขาย
// ========================================
export const createOrder = async (userId: string, input: {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  price?: number
  stopPrice?: number
  takeProfit?: number
}) => {
  // ตรวจสอบพอร์ตโฟลิโอ
  let portfolio = await prisma.portfolio.findUnique({
    where: { userId }
  })

  if (!portfolio) {
    // สร้างพอร์ตโฟลิโอให้อัตโนมัติ
    portfolio = await prisma.portfolio.create({
      data: { userId, balance: 10000, equity: 10000 }
    })
  }

  // ตรวจสอบเงินเพียงพอ (สำหรับ BUY)
  if (input.side === 'BUY' && input.type === 'MARKET') {
    const cost = input.quantity * (input.price || 0)
    if (cost > portfolio.balance) {
      throw new Error('Insufficient balance')
    }
  }

  // สร้างคำสั่งซื้อขาย
  const order = await prisma.order.create({
    data: {
      userId,
      symbol: input.symbol.toUpperCase(),
      side: input.side,
      type: input.type,
      quantity: input.quantity,
      price: input.price || null,
      stopPrice: input.stopPrice || null,
      takeProfit: input.takeProfit || null,
      status: OrderStatus.PENDING,
    }
  })

  // ถ้าเป็น MARKET ORDER ให้ execute ทันที
  if (input.type === 'MARKET') {
    return await executeMarketOrder(order.id)
  }

  return order
}

// ========================================
// 2. Execute Market Order
// ========================================
export const executeMarketOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true }
  })

  if (!order) throw new Error('Order not found')
  if (order.status !== 'PENDING' && order.status !== 'OPEN') {
    throw new Error('Order cannot be executed')
  }

  // ใช้ราคาจริง (จำลอง)
  const currentPrice = getCurrentPrice(order.symbol)
  const executedPrice = order.price || currentPrice
  const executedQty = order.quantity

  // คำนวณค่าใช้จ่าย
  const cost = executedQty * executedPrice
  const fee = cost * 0.001 // 0.1% fee

  // อัปเดตพอร์ตโฟลิโอ
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: order.userId }
  })

  if (!portfolio) throw new Error('Portfolio not found')

  if (order.side === 'BUY') {
    // เช็คเงิน
    if (cost + fee > portfolio.balance) {
      throw new Error('Insufficient balance')
    }

    // หักเงิน
    await prisma.portfolio.update({
      where: { userId: order.userId },
      data: {
        balance: { decrement: cost + fee }
      }
    })

    // อัปเดตหรือสร้าง Holding
    const existingHolding = await prisma.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: portfolio.id,
          symbol: order.symbol
        }
      }
    })

    if (existingHolding) {
      // คำนวณราคาเฉลี่ย
      const totalQty = existingHolding.quantity + executedQty
      const totalCost = (existingHolding.quantity * existingHolding.averagePrice) + cost
      const avgPrice = totalCost / totalQty

      await prisma.holding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: totalQty,
          averagePrice: avgPrice,
        }
      })
    } else {
      await prisma.holding.create({
        data: {
          portfolioId: portfolio.id,
          symbol: order.symbol,
          quantity: executedQty,
          averagePrice: executedPrice,
        }
      })
    }

  } else if (order.side === 'SELL') {
    // ตรวจสอบว่ามี Holding เพียงพอ
    const holding = await prisma.holding.findUnique({
      where: {
        portfolioId_symbol: {
          portfolioId: portfolio.id,
          symbol: order.symbol
        }
      }
    })

    if (!holding || holding.quantity < executedQty) {
      throw new Error('Insufficient holdings')
    }

    // คำนวณ PnL
    const pnl = (executedPrice - holding.averagePrice) * executedQty

    // อัปเดต Holding
    const remainingQty = holding.quantity - executedQty
    if (remainingQty > 0) {
      await prisma.holding.update({
        where: { id: holding.id },
        data: { quantity: remainingQty }
      })
    } else {
      await prisma.holding.delete({ where: { id: holding.id } })
    }

    // เพิ่มเงิน
    await prisma.portfolio.update({
      where: { userId: order.userId },
      data: {
        balance: { increment: cost - fee }
      }
    })

    // บันทึก Trade
    await prisma.trade.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        symbol: order.symbol,
        side: 'SELL',
        quantity: executedQty,
        price: executedPrice,
        fee,
        pnl,
        status: 'CLOSED',
        closedAt: new Date()
      }
    })
  }

  // อัปเดต Order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.FILLED,
      executedQty,
      avgPrice: executedPrice,
      fee,
      executedAt: new Date()
    }
  })

  // อัปเดตพอร์ตโฟลิโอ (equity)
  await updatePortfolioEquity(order.userId)

  return updatedOrder
}

// ========================================
// 3. ยกเลิกคำสั่งซื้อขาย
// ========================================
export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId
    }
  })

  if (!order) throw new Error('Order not found')
  if (order.status === 'FILLED' || order.status === 'CANCELLED') {
    throw new Error('Order cannot be cancelled')
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED }
  })
}

// ========================================
// 4. ดูคำสั่งซื้อขายทั้งหมด
// ========================================
export const getOrders = async (userId: string, filters?: {
  status?: OrderStatus
  symbol?: string
  limit?: number
  offset?: number
}) => {
  const where: any = { userId }
  
  if (filters?.status) where.status = filters.status
  if (filters?.symbol) where.symbol = filters.symbol

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })

  return orders
}

// ========================================
// 5. ดูพอร์ตโฟลิโอ
// ========================================
export const getPortfolio = async (userId: string) => {
  let portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true }
  })

  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: {
        userId,
        balance: 10000,
        equity: 10000,
      },
      include: { holdings: true }
    })
  }

  // คำนวณมูลค่าปัจจุบันของแต่ละ Holding
  const holdingsWithValue = await Promise.all(
    portfolio.holdings.map(async (holding) => {
      const currentPrice = getCurrentPrice(holding.symbol)
      const value = holding.quantity * currentPrice
      const pnl = (currentPrice - holding.averagePrice) * holding.quantity
      const pnlPercent = holding.averagePrice > 0 
        ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100 
        : 0

      return {
        ...holding,
        currentPrice,
        value,
        pnl,
        pnlPercent,
      }
    })
  )

  const totalEquity = portfolio.balance + holdingsWithValue.reduce(
    (sum, h) => sum + (h.value || 0), 0
  )

  const totalPnL = totalEquity - 10000 // เงินเริ่มต้น 10000

  return {
    ...portfolio,
    holdings: holdingsWithValue,
    totalEquity,
    totalPnL,
    totalPnLPercent: (totalPnL / 10000) * 100,
  }
}

// ========================================
// 6. ดูประวัติการซื้อขาย
// ========================================
export const getTradeHistory = async (userId: string, filters?: {
  symbol?: string
  limit?: number
  offset?: number
}) => {
  const where: any = { userId }
  if (filters?.symbol) where.symbol = filters.symbol

  const trades = await prisma.trade.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  })

  return trades
}

// ========================================
// Helper: ราคาปัจจุบัน (จำลอง)
// ========================================
const getCurrentPrice = (symbol: string): number => {
  const prices: Record<string, number> = {
    'BTCUSDT': 65000 + (Math.random() - 0.5) * 100,
    'ETHUSDT': 3500 + (Math.random() - 0.5) * 10,
    'BNBUSDT': 600 + (Math.random() - 0.5) * 2,
    'SOLUSDT': 180 + (Math.random() - 0.5) * 1,
    'ADAUSDT': 0.6 + (Math.random() - 0.5) * 0.02,
  }
  return prices[symbol] || 100
}

// ========================================
// Helper: อัปเดต Equity
// ========================================
const updatePortfolioEquity = async (userId: string) => {
  const portfolio = await getPortfolio(userId)
  await prisma.portfolio.update({
    where: { userId },
    data: {
      equity: portfolio.totalEquity,
      totalPnL: portfolio.totalPnL,
      totalPnLPercent: portfolio.totalPnLPercent,
    }
  })
}
