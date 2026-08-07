import { PriceData } from '../types/websocket.types'

export class PriceService {
  private prices: Map<string, PriceData> = new Map()
  private interval: NodeJS.Timeout | null = null
  private listeners: Set<(data: PriceData) => void> = new Set()

  constructor() {
    this.startSimulation()
  }

  startSimulation() {
    this.interval = setInterval(() => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT']
      symbols.forEach(symbol => {
        const basePrice = this.getBasePrice(symbol)
        const volatility = this.getVolatility(symbol)
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        
        const data: PriceData = {
          symbol,
          price: Math.round(price * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round((change / basePrice) * 100 * 100) / 100,
          volume: Math.round(Math.random() * 1000 * 100) / 100,
          high: Math.round((price + Math.random() * volatility * 0.5) * 100) / 100,
          low: Math.round((price - Math.random() * volatility * 0.5) * 100) / 100,
          timestamp: Date.now()
        }
        this.prices.set(symbol, data)
        this.broadcast(data)
      })
    }, 1000)
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTCUSDT': 65000, 'ETHUSDT': 3500, 'BNBUSDT': 600, 'SOLUSDT': 180, 'ADAUSDT': 0.6
    }
    return prices[symbol] || 100
  }

  private getVolatility(symbol: string): number {
    const volatility: Record<string, number> = {
      'BTCUSDT': 100, 'ETHUSDT': 50, 'BNBUSDT': 10, 'SOLUSDT': 5, 'ADAUSDT': 0.03
    }
    return volatility[symbol] || 1
  }

  subscribe(callback: (data: PriceData) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private broadcast(data: PriceData) {
    this.listeners.forEach(listener => listener(data))
  }
}

export const priceService = new PriceService()
import { PriceData } from '../types/websocket.types'

// เพิ่ม Asset Types
type AssetCategory = 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'INDEX'

export class PriceService {
  private prices: Map<string, PriceData> = new Map()
  private interval: NodeJS.Timeout | null = null
  private listeners: Set<(data: PriceData) => void> = new Set()

  constructor() {
    this.startSimulation()
  }

  startSimulation() {
    this.interval = setInterval(() => {
      // ===== CRYPTO =====
      const crypto = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT']
      crypto.forEach(symbol => {
        const basePrice = this.getBasePrice(symbol)
        const volatility = this.getVolatility(symbol)
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'CRYPTO')
      })

      // ===== GOLD (Spot) =====
      const goldSymbols = ['XAUUSD']
      goldSymbols.forEach(symbol => {
        const basePrice = 2400 + (Math.random() - 0.5) * 20
        const volatility = 5
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'COMMODITY')
      })

      // ===== GOLD (Futures) =====
      const goldFutures = ['GC']
      goldFutures.forEach(symbol => {
        const basePrice = 2410 + (Math.random() - 0.5) * 20
        const volatility = 5
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'COMMODITY')
      })

      // ===== SILVER =====
      const silverSymbols = ['XAGUSD', 'SI']
      silverSymbols.forEach(symbol => {
        const basePrice = 28 + (Math.random() - 0.5) * 1
        const volatility = 0.5
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'COMMODITY')
      })

      // ===== FOREX =====
      const forex = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD']
      forex.forEach(symbol => {
        const basePrice = this.getForexPrice(symbol)
        const volatility = this.getForexVolatility(symbol)
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'FOREX')
      })

      // ===== COMMODITIES =====
      const commodities = ['CL', 'NG', 'HG', 'ZC', 'ZS']
      commodities.forEach(symbol => {
        const basePrice = this.getCommodityPrice(symbol)
        const volatility = this.getCommodityVolatility(symbol)
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'COMMODITY')
      })

      // ===== INDICES =====
      const indices = ['SPX', 'NDX', 'DJI', 'FTSE', 'DAX', 'HSI']
      indices.forEach(symbol => {
        const basePrice = this.getIndexPrice(symbol)
        const volatility = this.getIndexVolatility(symbol)
        const change = (Math.random() - 0.5) * volatility * 2
        const price = basePrice + change
        this.updatePrice(symbol, price, change, 'INDEX')
      })

    }, 1000)
  }

  private updatePrice(symbol: string, price: number, change: number, category: string) {
    const existing = this.prices.get(symbol)
    const previousPrice = existing?.price || price
    
    // คำนวณ high/low
    const high = existing ? Math.max(existing.high, price) : price
    const low = existing ? Math.min(existing.low, price) : price

    const data: PriceData = {
      symbol,
      price: Math.round(price * (category === 'FOREX' ? 100000 : 100)) / (category === 'FOREX' ? 100000 : 100),
      change: Math.round(change * (category === 'FOREX' ? 100000 : 100)) / (category === 'FOREX' ? 100000 : 100),
      changePercent: Math.round((change / previousPrice) * 100 * 100) / 100,
      volume: Math.round(Math.random() * 1000 * 100) / 100,
      high: Math.round(high * (category === 'FOREX' ? 100000 : 100)) / (category === 'FOREX' ? 100000 : 100),
      low: Math.round(low * (category === 'FOREX' ? 100000 : 100)) / (category === 'FOREX' ? 100000 : 100),
      timestamp: Date.now()
    }
    this.prices.set(symbol, data)
    this.broadcast(data)
  }

  // ===== CRYPTO PRICES =====
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'BTCUSDT': 65000,
      'ETHUSDT': 3500,
      'BNBUSDT': 600,
      'SOLUSDT': 180,
      'ADAUSDT': 0.6,
      'XRPUSDT': 0.5,
      'DOTUSDT': 7,
      'AVAXUSDT': 40,
      'MATICUSDT': 0.8,
      'LINKUSDT': 15,
    }
    return prices[symbol] || 100
  }

  private getVolatility(symbol: string): number {
    const volatility: Record<string, number> = {
      'BTCUSDT': 100,
      'ETHUSDT': 50,
      'BNBUSDT': 10,
      'SOLUSDT': 5,
      'ADAUSDT': 0.03,
      'XRPUSDT': 0.02,
      'DOTUSDT': 0.5,
      'AVAXUSDT': 2,
      'MATICUSDT': 0.05,
      'LINKUSDT': 1,
    }
    return volatility[symbol] || 1
  }

  // ===== FOREX PRICES =====
  private getForexPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'EURUSD': 1.08,
      'GBPUSD': 1.27,
      'USDJPY': 150,
      'USDCHF': 0.88,
      'AUDUSD': 0.65,
      'USDCAD': 1.37,
      'NZDUSD': 0.60,
    }
    return prices[symbol] || 1
  }

  private getForexVolatility(symbol: string): number {
    const volatility: Record<string, number> = {
      'EURUSD': 0.005,
      'GBPUSD': 0.006,
      'USDJPY': 0.5,
      'USDCHF': 0.004,
      'AUDUSD': 0.005,
      'USDCAD': 0.005,
      'NZDUSD': 0.006,
    }
    return volatility[symbol] || 0.005
  }

  // ===== COMMODITY PRICES =====
  private getCommodityPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'CL': 75,
      'NG': 3.5,
      'HG': 4.2,
      'ZC': 450,
      'ZS': 1200,
    }
    return prices[symbol] || 100
  }

  private getCommodityVolatility(symbol: string): number {
    const volatility: Record<string, number> = {
      'CL': 2,
      'NG': 0.2,
      'HG': 0.1,
      'ZC': 10,
      'ZS': 20,
    }
    return volatility[symbol] || 1
  }

  // ===== INDEX PRICES =====
  private getIndexPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'SPX': 5500,
      'NDX': 19000,
      'DJI': 40000,
      'FTSE': 8000,
      'DAX': 18000,
      'HSI': 16000,
    }
    return prices[symbol] || 10000
  }

  private getIndexVolatility(symbol: string): number {
    const volatility: Record<string, number> = {
      'SPX': 50,
      'NDX': 100,
      'DJI': 200,
      'FTSE': 50,
      'DAX': 100,
      'HSI': 100,
    }
    return volatility[symbol] || 50
  }

  getPrice(symbol: string): PriceData | undefined {
    return this.prices.get(symbol)
  }

  getAllPrices(): PriceData[] {
    return Array.from(this.prices.values())
  }

  subscribe(callback: (data: PriceData) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private broadcast(data: PriceData) {
    this.listeners.forEach(listener => listener(data))
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export const priceService = new PriceService()

