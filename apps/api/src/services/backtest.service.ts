import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ========================================
// Types
// ========================================
interface BacktestConfig {
  strategyId?: string
  strategyConfig?: any
  symbol: string
  startDate: Date
  endDate: Date
  initialCapital: number
  timeframe?: string
  commission?: number
}

interface Candle {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface Trade {
  entryTime: Date
  exitTime: Date
  entryPrice: number
  exitPrice: number
  side: 'BUY' | 'SELL'
  quantity: number
  pnl: number
  pnlPercent: number
  fee: number
}

interface BacktestResult {
  name: string
  symbol: string
  startDate: Date
  endDate: Date
  initialCapital: number
  finalCapital: number
  totalReturn: number
  totalReturnPercent: number
  totalTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
  trades: Trade[]
  equityCurve: { timestamp: Date; equity: number }[]
  stats: {
    bestTrade: number
    worstTrade: number
    avgTrade: number
    avgTradePercent: number
    profitFactor: number
    totalFees: number
  }
}

// ========================================
// 1. รับข้อมูลราคาย้อนหลัง (จำลอง)
// ========================================
const getHistoricalData = async (symbol: string, startDate: Date, endDate: Date, timeframe: string = '1h'): Promise<Candle[]> => {
  // ในที่นี้จำลองข้อมูลขึ้นมา
  // ในจริงจะดึงจาก Database หรือ API
  const candles: Candle[] = []
  const basePrice = getBasePrice(symbol)
  const volatility = getVolatility(symbol)
  
  let currentDate = new Date(startDate)
  let currentPrice = basePrice

  while (currentDate <= endDate) {
    const change = (Math.random() - 0.5) * volatility * 2
    currentPrice = Math.max(currentPrice + change, 0.01)
    
    candles.push({
      timestamp: new Date(currentDate),
      open: currentPrice,
      high: currentPrice + Math.random() * volatility * 0.5,
      low: currentPrice - Math.random() * volatility * 0.5,
      close: currentPrice,
      volume: Math.random() * 1000,
    })
    
    // เพิ่มเวลา (1 ชั่วโมง)
    currentDate = new Date(currentDate.getTime() + 60 * 60 * 1000)
  }

  return candles
}

// ========================================
// 2. คำนวณ Indicators
// ========================================
const calculateIndicators = (candles: Candle[]) => {
  const closes = candles.map(c => c.close)
  
  // RSI
  const rsi = calculateRSI(closes, 14)
  
  // MACD
  const { macd, signal, histogram } = calculateMACD(closes)
  
  // Moving Averages
  const ma10 = calculateMA(closes, 10)
  const ma30 = calculateMA(closes, 30)
  const ma50 = calculateMA(closes, 50)
  
  // Bollinger Bands
  const { upper, middle, lower } = calculateBollingerBands(closes, 20, 2)
  
  return {
    rsi,
    macd,
    signal,
    histogram,
    ma10,
    ma30,
    ma50,
    bb: { upper, middle, lower }
  }
}

// ========================================
// 3. Helper Functions (Indicators)
// ========================================
const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const rsi: number[] = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsi.push(50)
      continue
    }
    let gains = 0
    let losses = 0
    for (let j = i - period; j < i; j++) {
      const change = prices[j] - prices[j - 1]
      if (change >= 0) gains += change
      else losses -= change
    }
    const avgGain = gains / period
    const avgLoss = losses / period
    if (avgLoss === 0) {
      rsi.push(100)
    } else {
      const rs = avgGain / avgLoss
      rsi.push(100 - (100 / (1 + rs)))
    }
  }
  return rsi
}

const calculateMACD = (prices: number[]) => {
  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)
  const macd = ema12.map((v, i) => v - ema26[i])
  const signal = calculateEMA(macd, 9)
  const histogram = macd.map((v, i) => v - signal[i])
  return { macd, signal, histogram }
}

const calculateMA = (prices: number[], period: number): number[] => {
  const ma: number[] = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ma.push(NaN)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j]
    }
    ma.push(sum / period)
  }
  return ma
}

const calculateEMA = (prices: number[], period: number): number[] => {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[i])
    } else {
      ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1])
    }
  }
  return ema
}

const calculateBollingerBands = (prices: number[], period: number, stdDev: number) => {
  const middle = calculateMA(prices, period)
  const upper: number[] = []
  const lower: number[] = []
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN)
      lower.push(NaN)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += Math.pow(prices[j] - middle[i], 2)
    }
    const std = Math.sqrt(sum / period)
    upper.push(middle[i] + stdDev * std)
    lower.push(middle[i] - stdDev * std)
  }
  return { upper, middle, lower }
}

// ========================================
// 4. เรียกใช้กลยุทธ์
// ========================================
const runStrategyOnCandles = (candles: Candle[], strategyType: string, config: any) => {
  const closes = candles.map(c => c.close)
  const indicators = calculateIndicators(candles)
  const signals: string[] = []
  
  for (let i = 0; i < candles.length; i++) {
    let signal = 'HOLD'
    
    switch (strategyType) {
      case 'MA_CROSSOVER': {
        const fastMA = config.fastMA || 10
        const slowMA = config.slowMA || 30
        if (i > slowMA) {
          const maFast = indicators.ma10[i] || 0
          const maSlow = indicators.ma30[i] || 0
          const prevMaFast = indicators.ma10[i - 1] || 0
          const prevMaSlow = indicators.ma30[i - 1] || 0
          
          if (prevMaFast <= prevMaSlow && maFast > maSlow) {
            signal = 'BUY'
          } else if (prevMaFast >= prevMaSlow && maFast < maSlow) {
            signal = 'SELL'
          }
        }
        break
      }
      
      case 'RSI_OVERSOLD': {
        const rsiValue = indicators.rsi[i] || 50
        const oversold = config.oversold || 30
        const overbought = config.overbought || 70
        
        if (rsiValue < oversold) signal = 'BUY'
        else if (rsiValue > overbought) signal = 'SELL'
        break
      }
      
      case 'MACD_SIGNAL': {
        const macdValue = indicators.macd[i] || 0
        const signalValue = indicators.signal[i] || 0
        const prevMacd = indicators.macd[i - 1] || 0
        const prevSignal = indicators.signal[i - 1] || 0
        
        if (prevMacd <= prevSignal && macdValue > signalValue) {
          signal = 'BUY'
        } else if (prevMacd >= prevSignal && macdValue < signalValue) {
          signal = 'SELL'
        }
        break
      }
      
      case 'BOLLINGER_BANDS': {
        const close = candles[i].close
        const upper = indicators.bb.upper[i] || Infinity
        const lower = indicators.bb.lower[i] || -Infinity
        
        if (close <= lower) signal = 'BUY'
        else if (close >= upper) signal = 'SELL'
        break
      }
      
      default: {
        // CUSTOM - ใช้ config ที่ผู้ใช้กำหนด
        signal = 'HOLD'
      }
    }
    
    signals.push(signal)
  }
  
  return signals
}

// ========================================
// 5. Execute Backtest (หลัก)
// ========================================
export const runBacktest = async (userId: string, config: BacktestConfig): Promise<BacktestResult> => {
  const {
    strategyId,
    strategyConfig,
    symbol,
    startDate,
    endDate,
    initialCapital,
    timeframe = '1h',
    commission = 0.001, // 0.1%
  } = config

  // 1. รับข้อมูล
  const candles = await getHistoricalData(symbol, startDate, endDate, timeframe)
  if (candles.length < 50) {
    throw new Error('Not enough data for backtesting (need at least 50 candles)')
  }

  // 2. หา strategy type
  let strategyType = 'CUSTOM'
  let strategyName = 'Custom Strategy'
  
  if (strategyId) {
    const strategy = await prisma.strategy.findFirst({
      where: { id: strategyId, userId }
    })
    if (strategy) {
      strategyType = strategy.type
      strategyName = strategy.name
    }
  }

  // 3. เรียกใช้กลยุทธ์
  const signals = runStrategyOnCandles(candles, strategyType, strategyConfig || {})

  // 4. Simulate Trading
  let capital = initialCapital
  let position = 0
  let entryPrice = 0
  const trades: Trade[] = []
  const equityCurve: { timestamp: Date; equity: number }[] = []
  
  let winningTrades = 0
  let totalPnl = 0
  let maxDrawdown = 0
  let peakEquity = initialCapital
  let totalFees = 0
  let bestTrade = -Infinity
  let worstTrade = Infinity

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]
    const signal = signals[i] || 'HOLD'
    const price = candle.close
    
    // ถ้ามีตำแหน่งอยู่แล้ว คำนวณมูลค่าพอร์ต
    const equity = capital + (position * price)
    equityCurve.push({ timestamp: candle.timestamp, equity })
    
    // อัปเดต Drawdown
    if (equity > peakEquity) peakEquity = equity
    const drawdown = peakEquity - equity
    if (drawdown > maxDrawdown) maxDrawdown = drawdown

    // Execute Signals
    if (signal === 'BUY' && position === 0) {
      // ซื้อ
      const quantity = capital / price * 0.95 // ใช้ 95% ของเงิน
      const fee = quantity * price * commission
      totalFees += fee
      const cost = quantity * price + fee
      
      if (cost <= capital) {
        position = quantity
        entryPrice = price
        capital -= cost
      }
      
    } else if (signal === 'SELL' && position > 0) {
      // ขาย
      const fee = position * price * commission
      totalFees += fee
      const revenue = position * price - fee
      capital += revenue
      
      // บันทึก Trade
      const pnl = (price - entryPrice) * position - fee
      totalPnl += pnl
      
      trades.push({
        entryTime: candles[i - 1]?.timestamp || candle.timestamp,
        exitTime: candle.timestamp,
        entryPrice: entryPrice,
        exitPrice: price,
        side: 'BUY',
        quantity: position,
        pnl: pnl,
        pnlPercent: (pnl / (entryPrice * position)) * 100,
        fee: fee,
      })
      
      if (pnl > 0) winningTrades++
      if (pnl > bestTrade) bestTrade = pnl
      if (pnl < worstTrade) worstTrade = pnl
      
      position = 0
      entryPrice = 0
    }
  }

  // ปิดตำแหน่งที่เหลือ
  if (position > 0) {
    const price = candles[candles.length - 1].close
    const fee = position * price * commission
    totalFees += fee
    capital += position * price - fee
  }

  // 5. คำนวณผลลัพธ์
  const finalCapital = capital + (position > 0 ? position * candles[candles.length - 1].close : 0)
  const totalReturn = finalCapital - initialCapital
  const totalReturnPercent = (totalReturn / initialCapital) * 100
  
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  
  const avgWin = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / (trades.filter(t => t.pnl > 0).length || 1)
  const avgLoss = trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / (trades.filter(t => t.pnl < 0).length || 1)
  
  const maxDrawdownPercent = (maxDrawdown / initialCapital) * 100
  
  // Sharpe Ratio (Annualized)
  const returns = equityCurve.map((e, i) => {
    if (i === 0) return 0
    return (e.equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity
  })
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365 * 24) : 0

  const profitFactor = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / 
                       Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)) || 0

  const result: BacktestResult = {
    name: strategyName,
    symbol,
    startDate,
    endDate,
    initialCapital,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    totalTrades,
    winRate,
    avgWin,
    avgLoss,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    trades,
    equityCurve,
    stats: {
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      avgTrade: totalTrades > 0 ? totalPnl / totalTrades : 0,
      avgTradePercent: totalTrades > 0 ? (totalPnl / totalTrades) / (initialCapital / 100) : 0,
      profitFactor,
      totalFees,
    }
  }

  // 6. บันทึกผล Backtest (ถ้ามี strategyId)
  if (strategyId) {
    await prisma.backtest.create({
      data: {
        userId,
        strategyId,
        name: strategyName,
        symbol,
        startDate,
        endDate,
        initialCapital,
        finalCapital: result.finalCapital,
        totalReturn: result.totalReturn,
        totalReturnPercent: result.totalReturnPercent,
        totalTrades: result.totalTrades,
        winRate: result.winRate,
        avgWin: result.avgWin,
        avgLoss: result.avgLoss,
        maxDrawdown: result.maxDrawdown,
        sharpeRatio: result.sharpeRatio,
        trades: result.trades,
        equityCurve: result.equityCurve,
        config: strategyConfig || {},
      }
    })
  }

  return result
}

// ========================================
// 6. ดูประวัติ Backtest
// ========================================
export const getBacktestHistory = async (userId: string, filters?: {
  symbol?: string
  limit?: number
}) => {
  const where: any = { userId }
  if (filters?.symbol) where.symbol = filters.symbol

  const backtests = await prisma.backtest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 20,
  })

  return backtests
}

// ========================================
// 7. ดู Backtest เดียว
// ========================================
export const getBacktest = async (backtestId: string, userId: string) => {
  const backtest = await prisma.backtest.findFirst({
    where: { id: backtestId, userId }
  })

  if (!backtest) throw new Error('Backtest not found')
  return backtest
}

// ========================================
// Helper: ราคาพื้นฐาน
// ========================================
const getBasePrice = (symbol: string): number => {
  const prices: Record<string, number> = {
    'BTCUSDT': 65000,
    'ETHUSDT': 3500,
    'BNBUSDT': 600,
    'SOLUSDT': 180,
    'ADAUSDT': 0.6,
  }
  return prices[symbol] || 100
}

const getVolatility = (symbol: string): number => {
  const vols: Record<string, number> = {
    'BTCUSDT': 100,
    'ETHUSDT': 50,
    'BNBUSDT': 10,
    'SOLUSDT': 5,
    'ADAUSDT': 0.03,
  }
  return vols[symbol] || 1
}
