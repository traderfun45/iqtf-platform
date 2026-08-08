import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// 1. Dashboard Summary
// ========================================
export const getDashboardSummary = async (userId: string) => {
  // 1. ดึงพอร์ตโฟลิโอ
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true }
  })

  if (!portfolio) {
    return {
      totalEquity: 10000,
      totalPnL: 0,
      totalPnLPercent: 0,
      balance: 10000,
      holdings: [],
      totalTrades: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
    }
  }

  // 2. ดึงประวัติการซื้อขาย
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // 3. คำนวณสถิติ
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

  const pnls = trades.map(t => t.pnl || 0)
  const avgPnL = pnls.length > 0 ? pnls.reduce((a, b) => a + b, 0) / pnls.length : 0
  
  // 4. คำนวณ Sharpe Ratio (แบบง่าย)
  const returns = trades.map(t => (t.pnl || 0) / 10000)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1))
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0

  // 5. คำนวณ Max Drawdown
  let maxDrawdown = 0
  let peak = portfolio.balance
  // (จำลองจาก Equity Curve)

  return {
    totalEquity: portfolio.equity || portfolio.balance,
    totalPnL: (portfolio.equity || portfolio.balance) - 10000,
    totalPnLPercent: ((portfolio.equity || portfolio.balance) / 10000 - 1) * 100,
    balance: portfolio.balance,
    holdings: portfolio.holdings.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity,
      averagePrice: h.averagePrice,
      currentPrice: h.currentPrice || h.averagePrice,
      value: h.quantity * (h.currentPrice || h.averagePrice),
      pnl: h.quantity * ((h.currentPrice || h.averagePrice) - h.averagePrice),
      pnlPercent: ((h.currentPrice || h.averagePrice) / h.averagePrice - 1) * 100,
    })),
    totalTrades,
    winRate,
    avgPnL,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    recentTrades: trades.slice(0, 10).map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      pnl: t.pnl || 0,
      createdAt: t.createdAt,
    })),
  }
}

// ========================================
// 2. Equity Curve (กราฟมูลค่าพอร์ต)
// ========================================
export const getEquityCurve = async (userId: string, days: number = 30) => {
  // จำลองข้อมูล Equity Curve (ในจริงจะดึงจาก History)
  const data = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let equity = 10000
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 100
    equity = Math.max(equity + change, 5000)
    data.push({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
      equity: Math.round(equity * 100) / 100,
    })
  }

  return data
}

// ========================================
// 3. Performance Metrics (เพิ่มเติม)
// ========================================
export const getPerformanceMetrics = async (userId: string) => {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      maxWin: 0,
      maxLoss: 0,
      profitFactor: 0,
      avgTrade: 0,
    }
  }

  const winningTrades = trades.filter(t => (t.pnl || 0) > 0)
  const losingTrades = trades.filter(t => (t.pnl || 0) < 0)
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
    : 0

  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
    : 0

  const maxWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(t => t.pnl || 0)) 
    : 0

  const maxLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(t => t.pnl || 0)) 
    : 0

  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / trades.length) * 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
    maxLoss: Math.round(maxLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgTrade: Math.round((totalPnL / trades.length) * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
  }
}
