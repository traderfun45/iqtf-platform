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
