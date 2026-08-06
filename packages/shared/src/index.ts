export interface Trade {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  amount: number
  price: number
  timestamp: Date
}

export interface Strategy {
  id: string
  name: string
  description?: string
  config: Record<string, any>
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const formatPrice = (price: number) => price.toFixed(2)
